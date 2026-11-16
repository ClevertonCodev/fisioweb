<?php

namespace Modules\ClinicFinance\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\ClinicFinance\Contracts\FinancialAttachmentRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialAttachmentServiceInterface;
use Modules\ClinicFinance\Models\FinancialAttachment;
use Modules\Cloudflare\Contracts\FileServiceInterface;

class FinancialAttachmentService implements FinancialAttachmentServiceInterface
{
    /** O link assinado vale poucos minutos: quem copiar o link não abre depois. */
    private const LINK_TTL_SECONDS = 300;

    public function __construct(
        protected FinancialAttachmentRepositoryInterface $repository,
        protected FileServiceInterface $files,
    ) {}

    public function list(int $clinicId, int $transactionId): Collection
    {
        $this->ensureOpenTransaction($clinicId, $transactionId);

        return $this->repository->listForTransaction($clinicId, $transactionId);
    }

    public function upload(int $clinicId, int $transactionId, int $uploadedByUserId, array $files): Collection
    {
        // Confere antes de subir: lançamento de outra clínica ou cheio não manda nada ao R2.
        $this->ensureOpenTransaction($clinicId, $transactionId);
        $this->ensureRoomFor($clinicId, $transactionId, count($files));
        $types = array_map(fn (UploadedFile $file) => $this->contentTypeOf($file), $files);

        $uploaded = [];

        try {
            // O R2 fica fora da transação: a rede não segura o lockForUpdate do lançamento.
            foreach ($files as $i => $file) {
                $uploaded[] = $this->files->uploadFileAs(
                    $file,
                    $this->directoryFor($clinicId, $transactionId),
                    $this->storedName($types[$i]),
                    $types[$i],
                );
            }

            return DB::transaction(function () use ($clinicId, $transactionId, $uploadedByUserId, $uploaded) {
                // De novo, com o lançamento travado: outra aba pode ter excluído ou enchido no meio.
                $this->ensureOpenTransaction($clinicId, $transactionId, lock: true);
                $this->ensureRoomFor($clinicId, $transactionId, count($uploaded));

                return collect($uploaded)->map(fn (array $result) => $this->repository->create([
                    'clinic_id'                => $clinicId,
                    'financial_transaction_id' => $transactionId,
                    'path'                     => $result['path'],
                    'original_name'            => $result['original_filename'],
                    'mime_type'                => $result['mime_type'],
                    'size'                     => $result['size'],
                    'uploaded_by_user_id'      => $uploadedByUserId,
                ]));
            });
        } catch (\Throwable $e) {
            // Nada fica pela metade: o que já subiu para o R2 sai junto com o rollback.
            foreach ($uploaded as $result) {
                try {
                    $this->files->deletePrivateFile($result['path']);
                } catch (\Throwable $cleanup) {
                    report($cleanup);
                }
            }

            throw $e;
        }
    }

    public function signedUrl(int $clinicId, int $transactionId, int $attachmentId): array
    {
        $attachment = $this->findOrFail($clinicId, $transactionId, $attachmentId);
        $link       = $this->files->createPresignedDownloadUrl(
            $attachment->path,
            self::LINK_TTL_SECONDS,
            $this->downloadName($attachment->original_name, $attachment->mime_type),
            $attachment->mime_type,
        );

        return ['url' => $link['url'], 'expires_at' => $link['expires_at']];
    }

    /** Nome com a extensão do tipo gravado: um `x.html` com conteúdo de PDF baixa como `x.pdf`. */
    private function downloadName(string $originalName, string $mimeType): string
    {
        $extension = FinancialAttachment::EXTENSION_BY_MIME[$mimeType] ?? null;

        if (is_null($extension)) {
            return $originalName;
        }

        $base = pathinfo($originalName, PATHINFO_FILENAME);

        return (empty($base) ? 'comprovante' : $base) . '.' . $extension;
    }

    public function delete(int $clinicId, int $transactionId, int $attachmentId): void
    {
        $attachment = $this->findOrFail($clinicId, $transactionId, $attachmentId);
        $path       = $attachment->path;

        $this->repository->delete($attachment);
        DB::afterCommit(fn () => $this->deleteStoredObject($path));
    }

    private function deleteStoredObject(string $path): void
    {
        try {
            $this->files->deletePrivateFile($path);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    private function findOrFail(int $clinicId, int $transactionId, int $attachmentId): FinancialAttachment
    {
        $this->ensureOpenTransaction($clinicId, $transactionId);
        $attachment = $this->repository->findForTransaction($clinicId, $transactionId, $attachmentId);
        abort_if(is_null($attachment), 404);

        return $attachment;
    }

    /** Lançamento de outra clínica ou na lixeira: 404 (o comprovante volta quando ele é restaurado). */
    private function ensureOpenTransaction(int $clinicId, int $transactionId, bool $lock = false): void
    {
        abort_unless($this->repository->openTransactionExists($clinicId, $transactionId, $lock), 404);
    }

    private function ensureRoomFor(int $clinicId, int $transactionId, int $incoming): void
    {
        $existing = $this->repository->countForTransaction($clinicId, $transactionId);
        $max      = FinancialAttachment::MAX_PER_TRANSACTION;

        if ($existing + $incoming > $max) {
            $left = max(0, $max - $existing);

            throw ValidationException::withMessages([
                'files' => $left === 0
                    ? "Este lançamento já tem {$max} comprovantes, o limite. Remova um para enviar outro."
                    : "Cada lançamento aceita até {$max} comprovantes. Dá para enviar só mais {$left}.",
            ]);
        }
    }

    /** Tipo pelo conteúdo do arquivo (o mesmo que a validação conferiu); fora da lista, 422. */
    private function contentTypeOf(UploadedFile $file): string
    {
        $type = (string) $file->getMimeType();

        if (!array_key_exists($type, FinancialAttachment::EXTENSION_BY_MIME)) {
            throw ValidationException::withMessages([
                'files' => 'O arquivo não é JPG, PNG, WEBP, HEIC ou PDF.',
            ]);
        }

        return $type;
    }

    /** Nome não adivinhável, com a extensão do tipo validado e nunca a que o navegador mandou. */
    private function storedName(string $type): string
    {
        return Str::uuid() . '.' . FinancialAttachment::EXTENSION_BY_MIME[$type];
    }

    /** O caminho no R2 começa pela clínica. */
    private function directoryFor(int $clinicId, int $transactionId): string
    {
        return "clinics/{$clinicId}/finances/transactions/{$transactionId}";
    }
}
