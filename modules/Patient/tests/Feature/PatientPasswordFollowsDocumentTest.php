<?php

namespace Modules\Patient\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Contracts\PatientServiceInterface;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientPasswordFollowsDocumentTest extends TestCase
{
    use RefreshDatabase;

    private const OLD_CPF = '12345678909';

    private const NEW_CPF = '70035068400';

    private function makePatient(array $overrides = []): Patient
    {
        return Patient::factory()->create(array_merge([
            'clinic_id' => Clinic::factory()->create()->id,
            'cpf'       => self::OLD_CPF,
            'email'     => 'maria@exemplo.com',
            'password'  => self::OLD_CPF,
        ], $overrides));
    }

    private function service(): PatientServiceInterface
    {
        return app(PatientServiceInterface::class);
    }

    private function storedPassword(Patient $patient): string
    {
        return Patient::query()->whereKey($patient->id)->value('password');
    }

    public function test_troca_de_cpf_leva_a_senha_padrao_junto(): void
    {
        $patient = $this->makePatient();

        $this->service()->update($patient->id, ['cpf' => self::NEW_CPF]);

        $this->assertTrue(Hash::check(self::NEW_CPF, $this->storedPassword($patient)));
        $this->assertFalse(Hash::check(self::OLD_CPF, $this->storedPassword($patient)));
    }

    public function test_troca_de_cpf_leva_a_senha_junto_mesmo_quando_ela_nao_era_o_cpf_antigo(): void
    {
        $patient = $this->makePatient(['password' => '98765432100']);

        $this->service()->update($patient->id, ['cpf' => self::NEW_CPF]);

        $this->assertTrue(Hash::check(self::NEW_CPF, $this->storedPassword($patient)));
    }

    public function test_troca_de_cpf_com_mascara_antiga_para_os_mesmos_numeros_leva_a_senha_junto(): void
    {
        $patient = $this->makePatient(['cpf' => '123.456.789-09', 'password' => 'qualquer']);

        $this->service()->update($patient->id, ['cpf' => self::OLD_CPF]);

        $this->assertTrue(Hash::check(self::OLD_CPF, $this->storedPassword($patient)));
    }

    public function test_clinica_troca_o_cpf_com_mascara_e_paciente_entra_com_o_cpf_novo(): void
    {
        $patient = $this->makePatient(['password' => '98765432100']);
        $user    = ClinicUser::factory()->create([
            'clinic_id' => $patient->clinic_id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);

        $this->actingAs($user, 'clinic')
            ->putJson("/api/clinic/patients/{$patient->id}", ['cpf' => '700.350.684-00'])
            ->assertOk();

        auth('clinic')->forgetUser();

        $this->postJson('/api/patient/auth/login', [
            'identifier' => self::NEW_CPF,
            'password'   => '98765432100',
            'clinic_id'  => $patient->clinic_id,
        ])->assertStatus(401);

        $this->postJson('/api/patient/auth/login', [
            'identifier' => self::NEW_CPF,
            'password'   => self::NEW_CPF,
            'clinic_id'  => $patient->clinic_id,
        ])->assertOk();
    }

    public function test_estrangeiro_sem_cpf_troca_de_email_leva_a_senha_padrao_junto(): void
    {
        $patient = $this->makePatient([
            'is_foreign' => true,
            'cpf'        => null,
            'password'   => 'maria@exemplo.com',
        ]);

        $this->service()->update($patient->id, ['email' => 'maria.nova@exemplo.com']);

        $this->assertTrue(Hash::check('maria.nova@exemplo.com', $this->storedPassword($patient)));
    }

    public function test_troca_de_email_com_cpf_nao_mexe_na_senha(): void
    {
        $patient = $this->makePatient();

        $this->service()->update($patient->id, ['email' => 'maria.nova@exemplo.com']);

        $this->assertTrue(Hash::check(self::OLD_CPF, $this->storedPassword($patient)));
    }

    public function test_atualizacao_sem_documento_nao_mexe_na_senha(): void
    {
        $patient = $this->makePatient();
        $before  = $this->storedPassword($patient);

        $this->service()->update($patient->id, ['name' => 'Maria Nova']);

        $this->assertSame($before, $this->storedPassword($patient));
    }
}
