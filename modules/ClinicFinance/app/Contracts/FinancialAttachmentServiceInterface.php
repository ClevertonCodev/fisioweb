<?php

namespace Modules\ClinicFinance\Contracts;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Modules\ClinicFinance\Models\FinancialAttachment;

/**
 * Comprovantes de um lançamento da clínica. Lançamento de outra clínica ou na
 * lixeira responde 404 em todas as operações.
 */
interface FinancialAttachmentServiceInterface
{
    /** @return Collection<int, FinancialAttachment> */
    public function list(int $clinicId, int $transactionId): Collection;

    /**
     * Envia os arquivos ao R2 (pasta da clínica) e grava um comprovante para cada.
     * Passar do limite por lançamento dá 422 no campo `files`.
     *
     * @param  array<int, UploadedFile>  $files
     * @return Collection<int, FinancialAttachment>
     */
    public function upload(int $clinicId, int $transactionId, int $uploadedByUserId, array $files): Collection;

    /** @return array{url: string, expires_at: string} link assinado de poucos minutos */
    public function signedUrl(int $clinicId, int $transactionId, int $attachmentId): array;

    public function delete(int $clinicId, int $transactionId, int $attachmentId): void;
}
