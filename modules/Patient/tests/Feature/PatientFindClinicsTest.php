<?php

namespace Modules\Patient\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Modules\Clinic\Models\Clinic;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientFindClinicsTest extends TestCase
{
    use RefreshDatabase;

    private const CPF = '12345678900';

    private const ENDPOINT = '/api/patient/auth/find-clinics';

    protected function setUp(): void
    {
        parent::setUp();

        RateLimiter::clear('127.0.0.1');
    }

    private function makePatient(Clinic $clinic, array $overrides = []): Patient
    {
        return Patient::factory()->create(array_merge([
            'clinic_id' => $clinic->id,
            'cpf'       => self::CPF,
            'email'     => 'maria@exemplo.com',
            'password'  => self::CPF,
            'is_active' => true,
            'status'    => 'em_tratamento',
        ], $overrides));
    }


    public function test_identificador_sem_vinculo_devolve_lista_vazia_e_nao_404(): void
    {
        $this->postJson(self::ENDPOINT, ['identifier' => '00000000000'])
            ->assertStatus(200)
            ->assertExactJson(['data' => []]);
    }

    public function test_resposta_de_sem_vinculo_e_indistinguivel_de_sem_clinicas_elegiveis(): void
    {
        $clinic = Clinic::factory()->create();
        $this->makePatient($clinic, ['is_active' => false]);

        $semVinculo = $this->postJson(self::ENDPOINT, ['identifier' => '99999999999']);
        $inelegivel = $this->postJson(self::ENDPOINT, ['identifier' => self::CPF]);

        $this->assertSame($semVinculo->status(), $inelegivel->status());
        $this->assertSame($semVinculo->json(), $inelegivel->json());
    }


    public function test_descobre_clinicas_por_cpf(): void
    {
        $clinic = Clinic::factory()->create(['name' => 'Clínica Cleverton', 'slug' => 'clinica-cleverton']);
        $this->makePatient($clinic);

        $this->postJson(self::ENDPOINT, ['identifier' => '123.456.789-00'])
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $clinic->id)
            ->assertJsonPath('data.0.name', 'Clínica Cleverton')
            ->assertJsonPath('data.0.slug', 'clinica-cleverton');
    }

    public function test_descobre_clinicas_por_email(): void
    {
        $clinic = Clinic::factory()->create();
        $this->makePatient($clinic);

        $this->postJson(self::ENDPOINT, ['identifier' => '  Maria@Exemplo.COM '])
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $clinic->id);
    }

    public function test_cpf_em_duas_clinicas_devolve_as_duas(): void
    {
        $clinicaA = Clinic::factory()->create();
        $clinicaB = Clinic::factory()->create();

        $this->makePatient($clinicaA);
        $this->makePatient($clinicaB);

        $this->postJson(self::ENDPOINT, ['identifier' => self::CPF])
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }


    public function test_clinica_com_paciente_inelegivel_nao_aparece(): void
    {
        $ativa    = Clinic::factory()->create();
        $inativa  = Clinic::factory()->create();

        $this->makePatient($ativa);
        $this->makePatient($inativa, ['is_active' => false]);

        $this->postJson(self::ENDPOINT, ['identifier' => self::CPF])
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ativa->id);
    }

    public function test_clinica_com_paciente_em_alta_aparece(): void
    {
        $clinic = Clinic::factory()->create();
        $this->makePatient($clinic, ['status' => Patient::STATUS_ALTA]);

        $this->postJson(self::ENDPOINT, ['identifier' => self::CPF])
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_slug_nulo_e_tolerado(): void
    {
        $clinic = Clinic::factory()->create(['slug' => null]);
        $this->makePatient($clinic);

        $this->postJson(self::ENDPOINT, ['identifier' => self::CPF])
            ->assertStatus(200)
            ->assertJsonPath('data.0.slug', null);
    }

    public function test_identificador_obrigatorio(): void
    {
        $this->postJson(self::ENDPOINT, [])->assertStatus(422);
    }
}
