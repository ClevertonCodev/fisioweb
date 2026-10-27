<?php

namespace Modules\Patient\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Modules\Clinic\Models\Clinic;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientAuthThrottleTest extends TestCase
{
    use RefreshDatabase;

    private const CPF = '12345678900';

    private const LOGIN = '/api/patient/auth/login';

    private const FIND_CLINICS = '/api/patient/auth/find-clinics';

    protected function setUp(): void
    {
        parent::setUp();

        // evita que a ordem dos testes influencie o resultado.
        RateLimiter::clear('cpf:' . self::CPF . '|127.0.0.1');
    }

    private function makePatient(): Patient
    {
        return Patient::factory()->create([
            'clinic_id' => Clinic::factory()->create()->id,
            'cpf'       => self::CPF,
            'password'  => self::CPF,
            'is_active' => true,
            'status'    => 'em_tratamento',
        ]);
    }

    public function test_login_bloqueia_apos_o_limite(): void
    {
        $patient = $this->makePatient();

        $payload = [
            'identifier' => self::CPF,
            'password'   => 'errada',
            'clinic_id'  => $patient->clinic_id,
        ];

        for ($i = 1; $i <= 5; $i++) {
            $this->postJson(self::LOGIN, $payload)->assertStatus(401);
        }

        $this->postJson(self::LOGIN, $payload)->assertStatus(429);
    }

    public function test_sucesso_zera_a_contagem(): void
    {
        $patient = $this->makePatient();

        $errado = [
            'identifier' => self::CPF,
            'password'   => 'errada',
            'clinic_id'  => $patient->clinic_id,
        ];

        $certo = [
            'identifier' => self::CPF,
            'password'   => self::CPF,
            'clinic_id'  => $patient->clinic_id,
        ];

        for ($i = 1; $i <= 4; $i++) {
            $this->postJson(self::LOGIN, $errado)->assertStatus(401);
        }

        $this->postJson(self::LOGIN, $certo)->assertStatus(200);

        for ($i = 1; $i <= 5; $i++) {
            $this->postJson(self::LOGIN, $errado)->assertStatus(401);
        }
    }

    public function test_identificadores_diferentes_nao_compartilham_o_limite(): void
    {
        $patient = $this->makePatient();

        for ($i = 1; $i <= 5; $i++) {
            $this->postJson(self::LOGIN, [
                'identifier' => self::CPF,
                'password'   => 'errada',
                'clinic_id'  => $patient->clinic_id,
            ])->assertStatus(401);
        }

        $this->postJson(self::LOGIN, [
            'identifier' => self::CPF,
            'password'   => 'errada',
            'clinic_id'  => $patient->clinic_id,
        ])->assertStatus(429);

        $this->postJson(self::LOGIN, [
            'identifier' => '99999999999',
            'password'   => 'errada',
            'clinic_id'  => $patient->clinic_id,
        ])->assertStatus(401);
    }

    public function test_find_clinics_bloqueia_apos_o_limite(): void
    {
        for ($i = 1; $i <= 10; $i++) {
            $this->postJson(self::FIND_CLINICS, ['identifier' => '0000000000' . $i])
                ->assertStatus(200);
        }

        $this->postJson(self::FIND_CLINICS, ['identifier' => '11111111111'])
            ->assertStatus(429);
    }
}
