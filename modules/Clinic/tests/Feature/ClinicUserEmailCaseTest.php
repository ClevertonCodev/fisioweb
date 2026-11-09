<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Testing\TestResponse;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Jobs\SendClinicEmailVerificationJob;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class ClinicUserEmailCaseTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $victim;

    private ClinicUser $attackerAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->victim = ClinicUser::factory()->create([
            'clinic_id' => Clinic::factory()->create()->id,
            'email'     => 'vitima@x.test',
        ]);
        $this->attackerAdmin = $this->masterOf(Clinic::factory()->create());
    }

    public function test_creating_a_user_with_the_upper_case_variant_of_another_clinic_email_gives_422(): void
    {
        $this->store('Vitima@X.test')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'Este e-mail já está em uso.']);

        $this->assertSame(1, ClinicUser::whereRaw('LOWER(email) = ?', ['vitima@x.test'])->count());
        $this->assertVictimStillLogsIn();
    }

    public function test_editing_the_own_email_to_the_upper_case_variant_of_another_clinic_email_gives_422(): void
    {
        $before = $this->attackerAdmin->email;

        $this->update($this->attackerAdmin, 'VITIMA@x.test')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'Este e-mail já está em uso.']);

        $this->assertSame($before, $this->attackerAdmin->fresh()->email);
        $this->assertVictimStillLogsIn();
    }

    public function test_the_email_of_a_deleted_user_is_still_taken(): void
    {
        $this->victim->delete();

        $this->store('vitima@x.test')->assertUnprocessable()->assertJsonValidationErrors(['email']);
        $this->store('Vitima@X.test')->assertUnprocessable()->assertJsonValidationErrors(['email']);
        $this->update($this->attackerAdmin, 'VITIMA@X.TEST')->assertUnprocessable()->assertJsonValidationErrors(['email']);
    }

    public function test_the_email_is_saved_trimmed_and_in_lower_case(): void
    {
        $id = $this->store('  Nova.Pessoa@Clinica.TEST ')->assertCreated()->json('data.id');
        $this->assertSame('nova.pessoa@clinica.test', ClinicUser::findOrFail($id)->email);

        $this->update($this->attackerAdmin, ' Mestre.Novo@Clinica.TEST')->assertOk();
        $this->assertSame('mestre.novo@clinica.test', $this->attackerAdmin->fresh()->email);
    }

    public function test_a_user_can_keep_the_own_email_changing_only_the_case(): void
    {
        $this->attackerAdmin->forceFill(['email' => 'Proprio@Clinica.test'])->save();

        $this->update($this->attackerAdmin, 'proprio@clinica.test')->assertOk();

        $this->assertSame('proprio@clinica.test', $this->attackerAdmin->fresh()->email);
    }

    public function test_an_admin_editing_a_legacy_upper_case_master_with_the_same_email_is_not_blocked(): void
    {
        $clinic = Clinic::factory()->create();
        $master = $this->masterOf($clinic);
        $master->forceFill(['email' => 'Mestre.Antigo@Clinica.test'])->save();
        $admin = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
            'mestre'    => ClinicUser::MESTRE_NO,
        ]);

        $this->forgetSession();
        $this->actingAs($admin, 'clinic')->putJson("/api/clinic/users/{$master->id}", [
            'name'  => 'Mestre Renomeado',
            'email' => 'Mestre.Antigo@Clinica.test',
        ])->assertOk();

        $this->assertSame('Mestre Renomeado', $master->fresh()->name);
        $this->assertSame('mestre.antigo@clinica.test', $master->fresh()->email);
    }

    public function test_the_master_created_by_the_operator_gets_the_email_in_lower_case(): void
    {
        $clinic = Clinic::factory()->create(['email' => 'Contato@Nova-Clinica.TEST']);

        $this->assertSame('contato@nova-clinica.test', $this->masterOf($clinic)->email);
    }

    public function test_a_clinic_with_the_upper_case_variant_of_a_user_email_does_not_get_a_second_account(): void
    {
        Clinic::factory()->create(['email' => 'VITIMA@x.test']);

        $this->assertSame(1, ClinicUser::withTrashed()->whereRaw('LOWER(email) = ?', ['vitima@x.test'])->count());
        $this->assertVictimStillLogsIn();
    }

    public function test_the_database_refuses_the_upper_case_variant_even_outside_the_request(): void
    {
        $this->expectException(UniqueConstraintViolationException::class);

        ClinicUser::factory()->create([
            'clinic_id' => $this->attackerAdmin->clinic_id,
            'email'     => 'Vitima@X.test',
        ]);
    }

    public function test_resend_verification_finds_a_legacy_upper_case_pending_user(): void
    {
        Queue::fake();
        $pending = ClinicUser::factory()->create([
            'clinic_id'         => $this->attackerAdmin->clinic_id,
            'email'             => 'Pendente.Antigo@Clinica.test',
            'email_verified_at' => null,
        ]);

        $this->forgetSession();
        $this->withHeaders(['Authorization' => ''])
            ->postJson('/api/clinic/auth/verify-email/resend', ['email' => 'pendente.antigo@clinica.test'])
            ->assertOk();

        Queue::assertPushed(
            SendClinicEmailVerificationJob::class,
            fn (SendClinicEmailVerificationJob $job): bool => $job->clinicUserId === (int) $pending->id,
        );
    }

    public function test_the_operator_cannot_create_a_clinic_with_the_upper_case_variant_of_a_user_email(): void
    {
        $this->forgetSession();
        $this->actingAs(AdminUser::factory()->create(), 'admin')->postJson('/api/admin/clinics', [
            'name'        => 'Clínica Variante',
            'email'       => 'Vitima@X.TEST',
            'document'    => '11222333000181',
            'type_person' => Clinic::TYPE_PERSON_JURIDICA,
            'slug'        => 'clinica-variante',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email' => 'Este e-mail já está em uso.']);

        $this->assertDatabaseMissing('clinics', ['slug' => 'clinica-variante']);
        $this->assertVictimStillLogsIn();
    }

    private function update(ClinicUser $target, string $email): TestResponse
    {
        $this->forgetSession();

        return $this->actingAs($this->attackerAdmin, 'clinic')->putJson("/api/clinic/users/{$target->id}", [
            'email' => $email,
        ]);
    }

    private function store(string $email): TestResponse
    {
        $this->forgetSession();

        return $this->actingAs($this->attackerAdmin, 'clinic')->postJson('/api/clinic/users', [
            'name'     => 'Colega',
            'email'    => $email,
            'password' => 'senha-segura-123',
            'role'     => ClinicUser::ROLE_SECRETARY,
            'document' => '11144477735',
        ]);
    }

    private function assertVictimStillLogsIn(): void
    {
        $this->forgetSession();

        $this->withHeaders(['Authorization' => ''])->postJson('/api/clinic/auth/login', [
            'email'    => 'vitima@x.test',
            'password' => 'password',
        ])->assertOk()->assertJsonPath('user.id', $this->victim->id);
    }

    private function masterOf(Clinic $clinic): ClinicUser
    {
        return ClinicUser::where('clinic_id', $clinic->id)->where('mestre', ClinicUser::MESTRE_YES)->firstOrFail();
    }

    /** O guard e o JWT da lib guardam o usuário e o token da requisição anterior. */
    private function forgetSession(): void
    {
        $this->app['auth']->forgetGuards();
        $this->app['tymon.jwt']->unsetToken();
    }
}
