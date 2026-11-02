<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Modules\Admin\Models\Plan;
use Modules\Clinic\Jobs\SendClinicEmailVerificationJob;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Notifications\VerifyClinicEmailNotification;
use Tests\TestCase;

class ClinicRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_slug_availability_checks_available_taken_reserved_and_invalid_slugs(): void
    {
        $existing = Clinic::factory()->create(['slug' => 'clinica-existente']);
        $trashed  = Clinic::factory()->create(['slug' => 'clinica-excluida']);
        $trashed->delete();

        $this->getJson('/api/clinic/auth/slug-availability?slug=clinica-nova')
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'available' => true,
                    'reason'    => null,
                ],
            ]);

        $this->getJson('/api/clinic/auth/slug-availability?slug=' . $existing->slug)
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'available' => false,
                    'reason'    => 'taken',
                ],
            ]);

        $this->getJson('/api/clinic/auth/slug-availability?slug=' . $trashed->slug)
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'available' => false,
                    'reason'    => 'taken',
                ],
            ]);

        foreach (['admin', 'clinica', 'api', 'paciente', 'design-system', 'login', 'fisioweb', 'suporte'] as $reserved) {
            $this->getJson('/api/clinic/auth/slug-availability?slug=' . $reserved)
                ->assertOk()
                ->assertExactJson([
                    'data' => [
                        'available' => false,
                        'reason'    => 'reserved',
                    ],
                ]);
        }

        foreach (['', '-comeca-com-hifen', 'termina-com-hifen-', 'tem--dois', 'tem espaco'] as $invalid) {
            $this->getJson('/api/clinic/auth/slug-availability?slug=' . urlencode($invalid))
                ->assertOk()
                ->assertExactJson([
                    'data' => [
                        'available' => false,
                        'reason'    => 'invalid',
                    ],
                ]);
        }
    }

    public function test_register_creates_active_clinic_in_premium_plan_and_master_user_with_chosen_password_and_queues_verification(): void
    {
        Queue::fake();

        $premiumPlan = Plan::create([
            'name'        => 'Premium',
            'type_charge' => Plan::TYPE_CHARGE_POR_USUARIO,
            'value_month' => 40.00,
            'value_year'  => 35.00,
        ]);

        $clinicsBefore = Clinic::count();
        $usersBefore   = ClinicUser::count();

        $response = $this->postJson('/api/clinic/auth/register', [
            'name'                  => 'Clínica Movimento',
            'type_person'           => Clinic::TYPE_PERSON_JURIDICA,
            'document'              => '11222333000181',
            'email'                 => 'contato@movimento.com.br',
            'phone'                 => '11987654321',
            'slug'                  => 'clinica-movimento',
            'password'              => 'SenhaForte!123',
            'password_confirmation' => 'SenhaForte!123',
            'terms_accepted'        => true,
        ]);

        $response->assertCreated()
            ->assertJsonMissingPath('access_token')
            ->assertJsonPath('data.email', 'contato@movimento.com.br');

        $this->assertSame($clinicsBefore + 1, Clinic::count());
        $this->assertSame($usersBefore + 1, ClinicUser::count());

        $clinic = Clinic::where('slug', 'clinica-movimento')->firstOrFail();
        $this->assertSame(Clinic::STATUS_ACTIVE, (int) $clinic->status);
        $this->assertSame($premiumPlan->id, (int) $clinic->plan_id);
        $this->assertSame('11222333000181', $clinic->document);
        $this->assertSame('11987654321', $clinic->phone);

        $master = ClinicUser::where('clinic_id', $clinic->id)->firstOrFail();
        $this->assertSame(ClinicUser::ROLE_ADMIN, $master->role);
        $this->assertSame(ClinicUser::MESTRE_YES, (int) $master->mestre);
        $this->assertSame(ClinicUser::STATUS_ACTIVE, (int) $master->status);
        $this->assertNull($master->email_verified_at);
        $this->assertNotNull($clinic->terms_accepted_at);
        $this->assertNotNull($master->terms_accepted_at);
        $this->assertTrue(Hash::check('SenhaForte!123', $master->password));
        $this->assertFalse(Hash::check('11222333000181', $master->password));

        Queue::assertPushed(
            SendClinicEmailVerificationJob::class,
            fn (SendClinicEmailVerificationJob $job): bool => $job->clinicUserId === (int) $master->id,
        );
    }

    public function test_queued_verification_job_sends_notification_with_signed_frontend_url(): void
    {
        Notification::fake();

        $this->postJson('/api/clinic/auth/register', $this->validPayload())->assertCreated();

        $master = ClinicUser::where('email', 'contato@movimento.com.br')->firstOrFail();

        Notification::assertSentTo(
            $master,
            VerifyClinicEmailNotification::class,
            fn (VerifyClinicEmailNotification $notification): bool => str_contains($notification->verificationUrl, '/clinica/confirmar-email?')
                && str_contains($notification->verificationUrl, 'signature='),
        );
    }

    public function test_register_rejects_duplicate_email_in_clinics_and_soft_deleted_clinic_users(): void
    {
        $otherClinic = Clinic::factory()->create(['email' => 'ocupado@outraclinica.com.br']);
        $trashedUser = ClinicUser::factory()->create(['email' => 'excluido@outraclinica.com.br']);
        $trashedUser->delete();

        $this->postJson('/api/clinic/auth/register', $this->validPayload([
            'email' => $otherClinic->email,
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->postJson('/api/clinic/auth/register', $this->validPayload([
            'email' => $trashedUser->email,
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_register_rejects_duplicate_and_invalid_documents_for_pf_and_pj(): void
    {
        Clinic::factory()->create(['document' => '11222333000181']);

        $this->postJson('/api/clinic/auth/register', $this->validPayload([
            'document' => '11.222.333/0001-81',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document']);

        $this->postJson('/api/clinic/auth/register', $this->validPayload([
            'type_person' => Clinic::TYPE_PERSON_JURIDICA,
            'document'    => '11111111111111',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document']);

        $this->postJson('/api/clinic/auth/register', $this->validPayload([
            'type_person' => Clinic::TYPE_PERSON_FISICA,
            'document'    => '11111111111',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document']);

        $this->postJson('/api/clinic/auth/register', $this->validPayload([
            'type_person' => Clinic::TYPE_PERSON_FISICA,
            'document'    => '529.982.247-25',
            'email'       => 'autonomo@fisio.com.br',
            'slug'        => 'fisio-autonomo',
        ]))->assertCreated();
    }

    public function test_register_rejects_duplicate_reserved_and_invalid_slugs(): void
    {
        Clinic::factory()->create(['slug' => 'clinica-ocupada']);

        $this->postJson('/api/clinic/auth/register', $this->validPayload([
            'slug' => 'clinica-ocupada',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['slug']);

        foreach (['admin', 'clinica', 'api', 'paciente', 'design-system', 'login', 'suporte'] as $index => $reserved) {
            $this->withServerVariables(['REMOTE_ADDR' => '10.0.1.' . ($index + 1)])
                ->postJson('/api/clinic/auth/register', $this->validPayload([
                    'slug' => $reserved,
                ]))
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['slug']);
        }

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.1.99'])
            ->postJson('/api/clinic/auth/register', $this->validPayload([
                'slug' => '-slug-invalido-',
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_register_rejects_short_or_mismatched_password(): void
    {
        $this->postJson('/api/clinic/auth/register', $this->validPayload([
            'password'              => 'curta12',
            'password_confirmation' => 'curta12',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->postJson('/api/clinic/auth/register', $this->validPayload([
            'password'              => 'SenhaForte!123',
            'password_confirmation' => 'OutraSenha!123',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->postJson('/api/clinic/auth/register', $this->validPayload([
            'terms_accepted' => false,
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['terms_accepted']);
    }

    public function test_register_rate_limiter_returns_429_on_sixth_attempt(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/clinic/auth/register', [])->assertUnprocessable();
        }

        $this->postJson('/api/clinic/auth/register', [])
            ->assertStatus(429)
            ->assertJson(['message' => 'Muitas tentativas. Aguarde um minuto e tente de novo.']);
    }

    public function test_login_blocks_unverified_user_with_right_password_kept_neutral_on_wrong_password_and_allows_after_verify(): void
    {
        Queue::fake();

        $this->postJson('/api/clinic/auth/register', $this->validPayload())->assertCreated();

        // Senha errada continua neutra (401), sem revelar que falta confirmar o e-mail.
        $this->postJson('/api/clinic/auth/login', [
            'email'    => 'contato@movimento.com.br',
            'password' => 'SenhaErrada!999',
        ])
            ->assertUnauthorized()
            ->assertJson(['message' => 'Credenciais inválidas.']);

        // Senha certa antes de confirmar o e-mail é barrada com 403.
        $this->postJson('/api/clinic/auth/login', [
            'email'    => 'contato@movimento.com.br',
            'password' => 'SenhaForte!123',
        ])
            ->assertForbidden()
            ->assertJson([
                'message' => 'Confirme seu e-mail para entrar. Enviamos o link para contato@movimento.com.br.',
            ])
            ->assertJsonMissingPath('access_token');

        $master = ClinicUser::where('email', 'contato@movimento.com.br')->firstOrFail();
        $params = $this->extractSignedParams($master);

        $this->postJson('/api/clinic/auth/verify-email', $params)
            ->assertOk()
            ->assertJson(['message' => 'E-mail confirmado com sucesso.']);

        $this->assertNotNull($master->fresh()->email_verified_at);

        // Reutilizar o mesmo link responde sucesso idempotente.
        $this->postJson('/api/clinic/auth/verify-email', $params)
            ->assertOk()
            ->assertJson(['message' => 'E-mail confirmado com sucesso.']);

        // Depois de confirmar, o login entra normalmente.
        $this->postJson('/api/clinic/auth/login', [
            'email'    => 'contato@movimento.com.br',
            'password' => 'SenhaForte!123',
        ])
            ->assertOk()
            ->assertJsonStructure(['access_token']);
    }

    public function test_verify_email_rejects_expired_tampered_or_other_user_links(): void
    {
        Queue::fake();

        $this->postJson('/api/clinic/auth/register', $this->validPayload())->assertCreated();
        $master    = ClinicUser::where('email', 'contato@movimento.com.br')->firstOrFail();
        $otherUser = ClinicUser::factory()->create(['email_verified_at' => null]);

        // Link expirado (1 segundo no passado).
        $expiredParams = $this->extractSignedParams($master, now()->subSecond()->getTimestamp());
        $this->postJson('/api/clinic/auth/verify-email', $expiredParams)
            ->assertStatus(422)
            ->assertJson(['message' => 'Link de confirmação inválido ou expirado. Peça um novo link.']);

        // Link com assinatura adulterada.
        $validParams              = $this->extractSignedParams($master);
        $tampered                 = $validParams;
        $tampered['signature']    = str_repeat('a', 64);
        $this->postJson('/api/clinic/auth/verify-email', $tampered)
            ->assertStatus(422)
            ->assertJson(['message' => 'Link de confirmação inválido ou expirado. Peça um novo link.']);

        // Link válido de $master tentando confirmar $otherUser.
        $wrongUser       = $validParams;
        $wrongUser['id'] = $otherUser->id;
        $this->postJson('/api/clinic/auth/verify-email', $wrongUser)
            ->assertStatus(422);

        $this->assertNull($master->fresh()->email_verified_at);
        $this->assertNull($otherUser->fresh()->email_verified_at);
    }

    public function test_resend_verification_returns_same_response_with_or_without_account_and_skips_already_verified(): void
    {
        Queue::fake();

        $this->postJson('/api/clinic/auth/register', $this->validPayload())->assertCreated();
        $unverified = ClinicUser::where('email', 'contato@movimento.com.br')->firstOrFail();
        $verified   = ClinicUser::factory()->create(['email_verified_at' => now()]);

        Queue::fake(); // limpa o job do register

        $resPending  = $this->postJson('/api/clinic/auth/verify-email/resend', ['email' => $unverified->email]);
        $resUnknown  = $this->postJson('/api/clinic/auth/verify-email/resend', ['email' => 'naoexiste@exemplo.com.br']);
        $resVerified = $this->postJson('/api/clinic/auth/verify-email/resend', ['email' => $verified->email]);

        $resPending->assertOk();
        $resUnknown->assertOk();
        $resVerified->assertOk();

        $this->assertSame($resPending->json(), $resUnknown->json());
        $this->assertSame($resPending->json(), $resVerified->json());

        Queue::assertPushed(SendClinicEmailVerificationJob::class, 1);
        Queue::assertPushed(
            SendClinicEmailVerificationJob::class,
            fn (SendClinicEmailVerificationJob $job): bool => $job->clinicUserId === (int) $unverified->id,
        );
    }

    public function test_admin_created_clinic_and_clinic_user_are_born_verified_and_backfill_migration_verifies_existing_nulls(): void
    {
        $clinic = Clinic::create([
            'name'        => 'Clínica Criada Pelo Admin',
            'email'       => 'admin-criou@clinica.com.br',
            'document'    => '11222333000181',
            'type_person' => Clinic::TYPE_PERSON_JURIDICA,
            'status'      => Clinic::STATUS_ACTIVE,
            'slug'        => 'clinica-admin-criou',
        ]);

        $master = ClinicUser::where('clinic_id', $clinic->id)->firstOrFail();
        $this->assertNotNull($master->email_verified_at);

        $member = app(\Modules\Clinic\Contracts\ClinicUserServiceInterface::class)->create([
            'name'     => 'Fisio Equipe',
            'email'    => 'equipe@clinica.com.br',
            'password' => 'SenhaEquipe123',
            'role'     => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ], (int) $clinic->id);

        $this->assertNotNull($member->email_verified_at);

        // Simula usuário legado sem email_verified_at e roda a migration de backfill.
        $legacy = ClinicUser::factory()->create(['email_verified_at' => null]);
        $this->assertNull($legacy->fresh()->email_verified_at);

        $migration = require base_path('modules/Clinic/database/migrations/2026_11_01_000001_backfill_email_verified_at_on_clinic_users_table.php');
        $migration->up();

        $this->assertNotNull($legacy->fresh()->email_verified_at);
    }

    /**
     * @return array{id: int, hash: string, expires: int, signature: string}
     */
    private function extractSignedParams(ClinicUser $user, ?int $expiresAt = null): array
    {
        $service = app(\Modules\Clinic\Contracts\ClinicRegistrationServiceInterface::class);
        $url     = $service->buildSignedVerificationUrl($user, $expiresAt);
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        return [
            'id'        => (int) ($query['id'] ?? 0),
            'hash'      => (string) ($query['hash'] ?? ''),
            'expires'   => (int) ($query['expires'] ?? 0),
            'signature' => (string) ($query['signature'] ?? ''),
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name'                  => 'Clínica Movimento',
            'type_person'           => Clinic::TYPE_PERSON_JURIDICA,
            'document'              => '11222333000181',
            'email'                 => 'contato@movimento.com.br',
            'phone'                 => '11987654321',
            'slug'                  => 'clinica-movimento',
            'password'              => 'SenhaForte!123',
            'password_confirmation' => 'SenhaForte!123',
            'terms_accepted'        => true,
        ], $overrides);
    }
}
