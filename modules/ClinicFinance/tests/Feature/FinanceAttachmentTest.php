<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Mockery\MockInterface;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Database\Seeders\FinancialCategorySeeder;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Models\FinancialAttachment;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\ClinicFinance\Policies\FinancialAttachmentPolicy;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Tests\TestCase;

/**
 * Comprovantes do lançamento (tarefa 014): até 5 por lançamento, JPG/PNG/WEBP/HEIC/PDF
 * de até 10 MB, guardados no R2 numa pasta da clínica e abertos só por link assinado.
 */
class FinanceAttachmentTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $secretary;

    private ClinicUser $otherAdmin;

    private FinancialTransaction $transaction;

    protected function setUp(): void
    {
        parent::setUp();

        // Data fixa no meio do mês: a da factory é aleatória, e no dia 31 o filtro por período cortava.
        $this->travelTo('2026-10-15 12:00:00');
        $this->seed(FinancialCategorySeeder::class);

        $this->clinic     = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->secretary  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $this->otherAdmin = ClinicUser::factory()->create(['clinic_id' => Clinic::factory()->create(['timezone' => 'UTC'])->id]);

        $this->transaction = FinancialTransaction::factory()->create([
            'clinic_id'             => $this->clinic->id,
            'financial_category_id' => FinancialCategory::query()->whereNull('clinic_id')->where('type', FinancialTransactionType::Entrada)->value('id'),
            'created_by_user_id'    => $this->secretary->id,
            'type'                  => FinancialTransactionType::Entrada,
            'description'           => 'Sessão',
            'date'                  => '2026-10-15',
            'gross_amount'          => 100,
            'net_amount'            => 100,
        ]);
    }

    public function test_secretary_uploads_receipts_into_the_clinic_folder_without_any_public_url(): void
    {
        $directories = [];
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use (&$directories) {
            $mock->shouldReceive('uploadFileAs')->twice()->andReturnUsing(function (UploadedFile $file, string $directory, string $filename, string $type) use (&$directories) {
                $directories[] = $directory;

                return $this->uploadResult($directory, $file->getClientOriginalName(), $type, $filename);
            });
        });

        $response = $this->actingAs($this->secretary, 'clinic')
            ->post($this->url(), [
                'files' => [
                    UploadedFile::fake()->create('recibo.pdf', 200, 'application/pdf'),
                    UploadedFile::fake()->image('foto.jpg'),
                ],
            ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.original_name', 'recibo.pdf')
            ->assertJsonPath('data.0.mime_type', 'application/pdf');

        foreach ($directories as $directory) {
            $this->assertStringStartsWith("clinics/{$this->clinic->id}/", $directory);
        }
        $this->assertDatabaseCount('clinic_financial_attachments', 2);
        foreach (\DB::table('clinic_financial_attachments')->pluck('path') as $path) {
            $this->assertStringStartsWith("clinics/{$this->clinic->id}/", $path);
        }
        $this->assertNoPublicUrl($response->getContent());
        $this->assertNoPublicUrl($this->actingAs($this->secretary, 'clinic')->getJson($this->url())->assertOk()->assertJsonCount(2, 'data')->getContent());
    }

    public function test_rejects_a_file_type_that_is_not_image_or_pdf(): void
    {
        $this->mock(FileServiceInterface::class, fn (MockInterface $mock) => $mock->shouldNotReceive('uploadFileAs'));

        $this->upload([UploadedFile::fake()->create('planilha.xlsx', 100, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['files.0' => 'não é JPG, PNG, WEBP, HEIC ou PDF']);
    }

    public function test_accepts_heic_and_webp_photos(): void
    {
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('uploadFileAs')->twice()->andReturnUsing(
                fn (UploadedFile $file, string $directory, string $filename, string $type) => $this->uploadResult($directory, $file->getClientOriginalName(), $type, $filename),
            );
        });

        $this->upload([
            UploadedFile::fake()->create('IMG_0001.heic', 300, 'image/heic'),
            UploadedFile::fake()->create('foto.webp', 300, 'image/webp'),
        ])->assertCreated()->assertJsonCount(2, 'data');
    }

    public function test_an_html_file_disguised_as_pdf_is_stored_with_the_pdf_extension_and_content_type(): void
    {
        // Arquivo de verdade (não o fake): o tipo sai do conteúdo, como na produção.
        $tmp = tempnam(sys_get_temp_dir(), 'comprovante');
        file_put_contents($tmp, "%PDF-1.4\n<html><script>alert(document.cookie)</script></html>");
        $file  = new UploadedFile($tmp, 'x.html', 'text/html', null, true);
        $calls = [];
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use (&$calls) {
            $mock->shouldNotReceive('uploadFile');
            $mock->shouldReceive('uploadFileAs')->once()->andReturnUsing(
                function (UploadedFile $file, string $directory, string $filename, string $type) use (&$calls) {
                    $calls[] = ['filename' => $filename, 'type' => $type];

                    return $this->uploadResult($directory, $file->getClientOriginalName(), $type, $filename);
                },
            );
        });

        try {
            $this->upload([$file])->assertCreated()->assertJsonPath('data.0.mime_type', 'application/pdf');
        } finally {
            @unlink($tmp);
        }

        $this->assertStringEndsWith('.pdf', $calls[0]['filename']);
        $this->assertStringNotContainsString('html', $calls[0]['filename']);
        $this->assertSame('application/pdf', $calls[0]['type']);
        $this->assertStringEndsWith('.pdf', (string) \DB::table('clinic_financial_attachments')->value('path'));
    }

    public function test_files_go_to_r2_before_the_database_transaction_is_opened(): void
    {
        $outside = \DB::transactionLevel();
        $levels  = [];
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use (&$levels) {
            $mock->shouldReceive('uploadFileAs')->once()->andReturnUsing(
                function (UploadedFile $file, string $directory, string $filename, string $type) use (&$levels) {
                    $levels[] = \DB::transactionLevel();

                    return $this->uploadResult($directory, 'r.pdf', $type, $filename);
                },
            );
        });

        $this->upload([UploadedFile::fake()->create('r.pdf', 10, 'application/pdf')])->assertCreated();

        $this->assertSame([$outside], $levels, 'O upload ao R2 não pode rodar com a transação (e o lockForUpdate) aberta.');
    }

    public function test_when_the_limit_fills_up_during_the_upload_the_files_sent_are_removed(): void
    {
        $uploaded = [];
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use (&$uploaded) {
            $mock->shouldReceive('uploadFileAs')->once()->andReturnUsing(
                function (UploadedFile $file, string $directory, string $filename, string $type) use (&$uploaded) {
                    // Outra aba enche o lançamento enquanto este arquivo sobe.
                    $this->createAttachments(5);
                    $uploaded[] = "{$directory}/{$filename}";

                    return $this->uploadResult($directory, 'r.pdf', $type, $filename);
                },
            );
            $mock->shouldNotReceive('deleteFile');
            $mock->shouldReceive('deletePrivateFile')->once()->withArgs(function (string $path) use (&$uploaded) {
                return $path === ($uploaded[0] ?? null);
            })->andReturnTrue();
        });

        $this->upload([UploadedFile::fake()->create('r.pdf', 10, 'application/pdf')])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['files' => 'já tem 5 comprovantes']);

        $this->assertDatabaseCount('clinic_financial_attachments', 5);
    }

    public function test_when_the_transaction_goes_to_the_trash_during_the_upload_it_answers_404_and_removes_the_file(): void
    {
        $uploaded = [];
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use (&$uploaded) {
            $mock->shouldReceive('uploadFileAs')->once()->andReturnUsing(
                function (UploadedFile $file, string $directory, string $filename, string $type) use (&$uploaded) {
                    // Outra aba manda o lançamento para a lixeira enquanto este arquivo sobe.
                    $this->transaction->delete();
                    $uploaded[] = "{$directory}/{$filename}";

                    return $this->uploadResult($directory, 'r.pdf', $type, $filename);
                },
            );
            $mock->shouldReceive('deletePrivateFile')->once()->withArgs(function (string $path) use (&$uploaded) {
                return $path === ($uploaded[0] ?? null);
            })->andReturnTrue();
        });

        $this->upload([UploadedFile::fake()->create('r.pdf', 10, 'application/pdf')])->assertNotFound();

        $this->assertSoftDeleted('clinic_financial_transactions', ['id' => $this->transaction->id]);
        $this->assertDatabaseCount('clinic_financial_attachments', 0);
    }

    public function test_rejects_a_file_larger_than_10_mb(): void
    {
        $this->mock(FileServiceInterface::class, fn (MockInterface $mock) => $mock->shouldNotReceive('uploadFileAs'));

        $this->upload([UploadedFile::fake()->create('grande.pdf', 10241, 'application/pdf')])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['files.0' => 'passa de 10 MB']);
    }

    public function test_accepts_a_file_of_exactly_10_mb(): void
    {
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('uploadFileAs')->once()->andReturnUsing(
                fn (UploadedFile $file, string $directory, string $filename, string $type) => $this->uploadResult($directory, 'limite.pdf', $type, $filename),
            );
        });

        $this->upload([UploadedFile::fake()->create('limite.pdf', 10240, 'application/pdf')])->assertCreated();
    }

    public function test_the_sixth_receipt_is_refused_and_nothing_is_uploaded(): void
    {
        $this->createAttachments(5);
        $this->mock(FileServiceInterface::class, fn (MockInterface $mock) => $mock->shouldNotReceive('uploadFileAs'));

        $this->upload([UploadedFile::fake()->create('sexto.pdf', 100, 'application/pdf')])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['files' => 'já tem 5 comprovantes']);

        $this->assertDatabaseCount('clinic_financial_attachments', 5);
    }

    public function test_sending_more_files_than_the_room_left_is_refused(): void
    {
        $this->createAttachments(4);
        $this->mock(FileServiceInterface::class, fn (MockInterface $mock) => $mock->shouldNotReceive('uploadFileAs'));

        $this->upload([
            UploadedFile::fake()->create('a.pdf', 100, 'application/pdf'),
            UploadedFile::fake()->create('b.pdf', 100, 'application/pdf'),
        ])->assertUnprocessable()->assertJsonValidationErrors(['files' => 'só mais 1']);
    }

    public function test_six_files_in_one_request_are_refused(): void
    {
        $this->mock(FileServiceInterface::class, fn (MockInterface $mock) => $mock->shouldNotReceive('uploadFileAs'));

        $this->upload(array_map(
            fn (int $i) => UploadedFile::fake()->create("r{$i}.pdf", 10, 'application/pdf'),
            range(1, 6),
        ))->assertUnprocessable()->assertJsonValidationErrors(['files' => 'até 5 comprovantes']);
    }

    public function test_the_signed_link_is_generated_for_the_own_clinic_and_expires_in_minutes(): void
    {
        [$id] = $this->createAttachments(1);
        $this->travelTo(now()->setTime(12, 0));
        $path = "clinics/{$this->clinic->id}/finances/transactions/{$this->transaction->id}/r1.pdf";
        // Como o R2 devolve de verdade: o link assinado traz o caminho do arquivo (ADR 026, decisão 6).
        $signed = "https://conta.r2.cloudflarestorage.com/bucket/{$path}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=300&X-Amz-Signature=abc";
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use ($path, $signed) {
            $mock->shouldReceive('createPresignedDownloadUrl')
                ->once()
                ->withArgs(fn (string $p, int $ttl, ?string $name, ?string $type = null) => $p === $path
                    && $ttl <= 600 && $name === 'r1.pdf' && $type === 'application/pdf')
                ->andReturn(['url' => $signed, 'expires_at' => now()->addMinutes(5)->toISOString()]);
        });

        $response = $this->actingAs($this->secretary, 'clinic')
            ->getJson("{$this->url()}/{$id}/url")
            ->assertOk()
            ->assertExactJson(['data' => [
                'url'        => $signed,
                'expires_at' => now()->addMinutes(5)->toISOString(),
            ]]);

        // É o único lugar em que o caminho aparece: dentro do link de 5 minutos, nunca como campo.
        $this->assertStringContainsString($path, (string) $response->json('data.url'));
        $this->assertStringNotContainsString('"path"', $response->getContent());
        $this->assertStringNotContainsString('cdn_url', $response->getContent());
    }

    public function test_the_download_name_takes_the_extension_of_the_stored_type_not_the_one_the_client_sent(): void
    {
        [$html, $bare, $upper] = $this->createAttachments(3);
        \DB::table('clinic_financial_attachments')->where('id', $html)->update(['original_name' => 'x.html']);
        \DB::table('clinic_financial_attachments')->where('id', $bare)->update(['original_name' => 'recibo']);
        \DB::table('clinic_financial_attachments')->where('id', $upper)->update(['original_name' => 'Foto Março.JPG', 'mime_type' => 'image/jpeg']);
        $names = [];
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use (&$names) {
            $mock->shouldReceive('createPresignedDownloadUrl')->times(3)->andReturnUsing(
                function (string $path, int $ttl, ?string $name, ?string $type) use (&$names) {
                    $names[] = [$name, $type];

                    return ['url' => 'https://assinado', 'expires_at' => now()->toISOString()];
                },
            );
        });

        foreach ([$html, $bare, $upper] as $id) {
            $this->actingAs($this->secretary, 'clinic')->getJson("{$this->url()}/{$id}/url")->assertOk();
        }

        $this->assertSame([
            ['x.pdf', 'application/pdf'],
            ['recibo.pdf', 'application/pdf'],
            ['Foto Março.jpg', 'image/jpeg'],
        ], $names);
    }

    public function test_another_clinic_does_not_list_upload_open_or_remove_receipts(): void
    {
        [$id] = $this->createAttachments(1);
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldNotReceive('uploadFileAs');
            $mock->shouldNotReceive('createPresignedDownloadUrl');
            $mock->shouldNotReceive('deleteFile');
            $mock->shouldNotReceive('deletePrivateFile');
        });

        $as = $this->actingAs($this->otherAdmin, 'clinic');
        $as->getJson($this->url())->assertNotFound();
        $as->getJson("{$this->url()}/{$id}/url")->assertNotFound();
        $as->deleteJson("{$this->url()}/{$id}")->assertNotFound();
        $this->upload([UploadedFile::fake()->create('x.pdf', 10, 'application/pdf')], $this->otherAdmin)->assertNotFound();

        $this->assertDatabaseHas('clinic_financial_attachments', ['id' => $id]);
        $this->assertDatabaseCount('clinic_financial_attachments', 1);
    }

    public function test_a_receipt_of_another_transaction_is_not_reached_through_this_one(): void
    {
        $other = FinancialTransaction::factory()->create([
            'clinic_id'             => $this->clinic->id,
            'financial_category_id' => $this->transaction->financial_category_id,
            'created_by_user_id'    => $this->secretary->id,
        ]);
        [$id] = $this->createAttachments(1, $other);
        $this->mock(FileServiceInterface::class, fn (MockInterface $mock) => $mock->shouldNotReceive('createPresignedDownloadUrl'));

        $this->actingAs($this->secretary, 'clinic')->getJson("{$this->url()}/{$id}/url")->assertNotFound();
    }

    public function test_receipts_of_a_trashed_transaction_are_404_and_come_back_on_restore(): void
    {
        [$id] = $this->createAttachments(1);
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldNotReceive('deleteFile');
            $mock->shouldNotReceive('deletePrivateFile');
            $mock->shouldReceive('createPresignedDownloadUrl')->once()->andReturn(['url' => 'https://assinado', 'expires_at' => now()->toISOString()]);
        });
        $as = $this->actingAs($this->secretary, 'clinic');

        $as->deleteJson('/api/clinic/finances/transactions/' . $this->transaction->id)->assertNoContent();
        $as->getJson($this->url())->assertNotFound();
        $as->getJson("{$this->url()}/{$id}/url")->assertNotFound();
        $this->upload([UploadedFile::fake()->create('x.pdf', 10, 'application/pdf')])->assertNotFound();
        $this->assertDatabaseHas('clinic_financial_attachments', ['id' => $id]);

        $as->postJson('/api/clinic/finances/transactions/' . $this->transaction->id . '/restore')->assertOk();
        $as->getJson($this->url())->assertOk()->assertJsonPath('data.0.id', $id);
        $as->getJson("{$this->url()}/{$id}/url")->assertOk()->assertJsonPath('data.url', 'https://assinado');
    }

    public function test_removing_a_receipt_deletes_the_row_and_the_file(): void
    {
        [$id, $keep] = $this->createAttachments(2);
        $path        = "clinics/{$this->clinic->id}/finances/transactions/{$this->transaction->id}/r1.pdf";
        // A remoção usa o método que não registra o caminho no log (o deleteFile registra).
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use ($path) {
            $mock->shouldNotReceive('deleteFile');
            $mock->shouldReceive('deletePrivateFile')->once()->with($path)->andReturnTrue();
        });

        $this->actingAs($this->secretary, 'clinic')->deleteJson("{$this->url()}/{$id}")->assertNoContent();

        $this->assertDatabaseMissing('clinic_financial_attachments', ['id' => $id]);
        $this->assertDatabaseHas('clinic_financial_attachments', ['id' => $keep]);
    }

    public function test_a_failure_removing_the_stored_receipt_is_reported_and_keeps_the_deletion(): void
    {
        Exceptions::fake();
        [$id] = $this->createAttachments(1);
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('deletePrivateFile')->once()->andThrow(new \RuntimeException('Failed to delete file in clinics'));
        });

        $this->actingAs($this->secretary, 'clinic')->deleteJson("{$this->url()}/{$id}")->assertNoContent();

        $this->assertDatabaseMissing('clinic_financial_attachments', ['id' => $id]);
        Exceptions::assertReported(fn (\RuntimeException $e) => $e->getMessage() === 'Failed to delete file in clinics');
    }

    public function test_physiotherapist_gets_403_on_every_receipt_route(): void
    {
        [$id]   = $this->createAttachments(1);
        $physio = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldNotReceive('uploadFileAs');
            $mock->shouldNotReceive('createPresignedDownloadUrl');
            $mock->shouldNotReceive('deleteFile');
            $mock->shouldNotReceive('deletePrivateFile');
        });

        $as = $this->actingAs($physio, 'clinic');
        $as->getJson($this->url())->assertForbidden();
        $as->getJson("{$this->url()}/{$id}/url")->assertForbidden();
        $as->deleteJson("{$this->url()}/{$id}")->assertForbidden();
        $this->upload([UploadedFile::fake()->create('x.pdf', 10, 'application/pdf')], $physio)->assertForbidden();
    }

    public function test_receipts_are_authorized_by_their_own_policy_for_admin_and_secretary_only(): void
    {
        $policy = Gate::getPolicyFor(FinancialAttachment::class);
        $this->assertInstanceOf(FinancialAttachmentPolicy::class, $policy);

        $physio = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $admin  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        foreach (['viewAny', 'create', 'delete'] as $ability) {
            $this->assertTrue(Gate::forUser($this->secretary)->allows($ability, FinancialAttachment::class), "secretária: {$ability}");
            $this->assertTrue(Gate::forUser($admin)->allows($ability, FinancialAttachment::class), "administrador: {$ability}");
            $this->assertFalse(Gate::forUser($physio)->allows($ability, FinancialAttachment::class), "fisioterapeuta: {$ability}");
        }
    }

    public function test_receipts_have_an_index_by_transaction_alone(): void
    {
        // A contagem da listagem (withCount) e o cascade da FK buscam só pelo lançamento.
        $columns = array_map(
            fn (array $index) => $index['columns'],
            Schema::getIndexes('clinic_financial_attachments'),
        );

        $this->assertContains(['financial_transaction_id'], $columns);
    }

    public function test_the_listing_brings_the_receipt_count(): void
    {
        $this->createAttachments(3);

        $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/finances/transactions?period=2026-10')
            ->assertOk()
            ->assertJsonPath('data.0.id', $this->transaction->id)
            ->assertJsonPath('data.0.attachments_count', 3);
    }

    /** @param  array<int, UploadedFile>  $files */
    private function upload(array $files, ?ClinicUser $as = null, ?FinancialTransaction $transaction = null)
    {
        return $this->actingAs($as ?? $this->secretary, 'clinic')
            ->post($this->url($transaction), ['files' => $files], ['Accept' => 'application/json']);
    }

    /** @return array<int, int> ids dos comprovantes criados direto no banco */
    private function createAttachments(int $count, ?FinancialTransaction $transaction = null): array
    {
        $transaction ??= $this->transaction;

        return array_map(fn (int $i) => \DB::table('clinic_financial_attachments')->insertGetId([
            'clinic_id'                => $transaction->clinic_id,
            'financial_transaction_id' => $transaction->id,
            'path'                     => "clinics/{$transaction->clinic_id}/finances/transactions/{$transaction->id}/r{$i}.pdf",
            'original_name'            => "r{$i}.pdf",
            'mime_type'                => 'application/pdf',
            'size'                     => 100,
            'uploaded_by_user_id'      => $this->secretary->id,
            'created_at'               => now(),
            'updated_at'               => now(),
        ]), range(1, $count));
    }

    private function url(?FinancialTransaction $transaction = null): string
    {
        return '/api/clinic/finances/transactions/' . ($transaction ?? $this->transaction)->id . '/attachments';
    }

    /** @return array{filename: string, original_filename: string, path: string, mime_type: string, size: int} */
    private function uploadResult(string $directory, string $name, string $mime, string $filename): array
    {
        return [
            'filename'          => $filename,
            'original_filename' => $name,
            'path'              => $directory . '/' . $filename,
            'mime_type'         => $mime,
            'size'              => 1234,
        ];
    }

    private function assertNoPublicUrl(string $json): void
    {
        $this->assertStringNotContainsString('cdn.example.com', $json);
        $this->assertStringNotContainsString('r2.example.com', $json);
        $this->assertStringNotContainsString('cdn_url', $json);
        $this->assertStringNotContainsString('"path"', $json);
    }
}
