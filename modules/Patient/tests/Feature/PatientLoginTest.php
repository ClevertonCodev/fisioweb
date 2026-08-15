<?php

namespace Modules\Patient\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Modules\Clinic\Models\Clinic;
use Modules\Patient\Models\Patient;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PatientLoginTest extends TestCase
{
    use RefreshDatabase;

    private const CPF = '12345678900';

    private const ENDPOINT = '/api/patient/auth/login';

    protected function setUp(): void
    {
        parent::setUp();

        // Sem isso um teste envenena o seguinte pelo limiter compartilhado.
        RateLimiter::clear('cpf:' . self::CPF . '|127.0.0.1');
    }

    private function makePatient(array $overrides = []): Patient
    {
        $clinic = $overrides['clinic'] ?? Clinic::factory()->create();
        unset($overrides['clinic']);

        // Espelha PatientService::create — senha padrão é o CPF.
        return Patient::factory()->create(array_merge([
            'clinic_id' => $clinic->id,
            'cpf'       => self::CPF,
            'email'     => 'maria@exemplo.com',
            'password'  => self::CPF,
            'is_active' => true,
            'status'    => 'em_tratamento',
        ], $overrides));
    }

    // ---------------------------------------------------------------- SC-005

    public function test_senha_incorreta_e_recusada(): void
    {
        $patient = $this->makePatient();

        $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => 'senha-totalmente-errada',
            'clinic_id'  => $patient->clinic_id,
        ])->assertStatus(401)
            ->assertJson(['message' => 'Credenciais inválidas.']);
    }

    public function test_senha_padrao_continua_autenticando(): void
    {
        $patient = $this->makePatient();

        $response = $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => self::CPF,
            'clinic_id'  => $patient->clinic_id,
        ]);

        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('access_token'));
        $this->assertSame('bearer', $response->json('token_type'));
        $this->assertSame($patient->id, $response->json('user.id'));
    }

    public function test_login_sem_campo_de_senha_e_rejeitado(): void
    {
        // O exploit antigo: conhecer o CPF bastava.
        $patient = $this->makePatient();

        $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'clinic_id'  => $patient->clinic_id,
        ])->assertStatus(422);
    }

    // ------------------------------------------- tolerância de máscara na senha

    public function test_senha_com_mascara_autentica_quando_a_senha_e_o_cpf(): void
    {
        // O sistema exibe o CPF mascarado em todas as telas; o paciente digita
        // como vê. Sem essa tolerância ele fica travado, e não há recuperação
        // de senha no v1.
        $patient = $this->makePatient();

        $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => '123.456.789-00',
            'clinic_id'  => $patient->clinic_id,
        ])->assertStatus(200);
    }

    public function test_senha_errada_continua_recusada_mesmo_com_pontuacao(): void
    {
        $patient = $this->makePatient();

        $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => '999.999.999-99',
            'clinic_id'  => $patient->clinic_id,
        ])->assertStatus(401);
    }

    public function test_senha_personalizada_com_pontuacao_tem_precedencia(): void
    {
        // A tentativa exata vem primeiro: quem trocou a senha para algo com
        // pontuação não é afetado pela normalização.
        $patient = $this->makePatient(['password' => 'a.b-c.1-2']);

        $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => 'a.b-c.1-2',
            'clinic_id'  => $patient->clinic_id,
        ])->assertStatus(200);
    }

    public function test_senha_so_de_pontuacao_nao_vira_senha_vazia(): void
    {
        $patient = $this->makePatient();

        $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => '...---...',
            'clinic_id'  => $patient->clinic_id,
        ])->assertStatus(401);
    }

    // ------------------------------------------------- clínica por slug (R5)

    public function test_autentica_com_clinic_slug_em_vez_de_clinic_id(): void
    {
        // Caminho do deep link: o paciente conhece o slug, não o id.
        $clinic  = Clinic::factory()->create(['slug' => 'clinica-cleverton']);
        $patient = $this->makePatient(['clinic' => $clinic]);

        $response = $this->postJson(self::ENDPOINT, [
            'identifier'  => self::CPF,
            'password'    => self::CPF,
            'clinic_slug' => 'clinica-cleverton',
        ]);

        $response->assertStatus(200);
        $this->assertSame($patient->id, $response->json('user.id'));
    }

    public function test_slug_inexistente_devolve_401_generico(): void
    {
        $this->makePatient();

        $this->postJson(self::ENDPOINT, [
            'identifier'  => self::CPF,
            'password'    => self::CPF,
            'clinic_slug' => 'clinica-que-nao-existe',
        ])->assertStatus(401)
            ->assertJson(['message' => 'Credenciais inválidas.']);
    }

    public function test_slug_resolve_a_clinica_correta_entre_duas(): void
    {
        $clinicaA = Clinic::factory()->create(['slug' => 'clinica-a']);
        $clinicaB = Clinic::factory()->create(['slug' => 'clinica-b']);

        $this->makePatient(['clinic' => $clinicaA]);
        $pacienteB = $this->makePatient(['clinic' => $clinicaB]);

        $response = $this->postJson(self::ENDPOINT, [
            'identifier'  => self::CPF,
            'password'    => self::CPF,
            'clinic_slug' => 'clinica-b',
        ]);

        $response->assertStatus(200);
        $this->assertSame($pacienteB->id, $response->json('user.id'));
    }

    public function test_sem_clinic_id_e_sem_clinic_slug_e_rejeitado(): void
    {
        $this->makePatient();

        $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => self::CPF,
        ])->assertStatus(422);
    }

    // ---------------------------------------------------------------- SC-004

    public static function identifierProvider(): array
    {
        return [
            'cpf com mascara' => ['123.456.789-00'],
            'cpf sem mascara' => ['12345678900'],
            'email'           => ['maria@exemplo.com'],
            'email com caixa' => ['  Maria@Exemplo.COM '],
        ];
    }

    #[DataProvider('identifierProvider')]
    public function test_cpf_e_email_autenticam_o_mesmo_paciente(string $identifier): void
    {
        $patient = $this->makePatient();

        $response = $this->postJson(self::ENDPOINT, [
            'identifier' => $identifier,
            'password'   => self::CPF,
            'clinic_id'  => $patient->clinic_id,
        ]);

        $response->assertStatus(200);
        $this->assertSame($patient->id, $response->json('user.id'));
    }

    // ------------------------------------------------------------ R8 / Val.4

    public static function ineligibleProvider(): array
    {
        return [
            'inativo'   => [['is_active' => false]],
            'obito'     => [['status' => Patient::STATUS_OBITO]],
            'cancelado' => [['status' => Patient::STATUS_CANCELADO]],
        ];
    }

    #[DataProvider('ineligibleProvider')]
    public function test_paciente_inelegivel_nao_autentica(array $overrides): void
    {
        $patient = $this->makePatient($overrides);

        $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => self::CPF,
            'clinic_id'  => $patient->clinic_id,
        ])->assertStatus(401)
            ->assertJson(['message' => 'Credenciais inválidas.']);
    }

    public function test_paciente_com_alta_continua_autenticando(): void
    {
        // Alta é desfecho positivo — é quando o paciente ainda quer rever
        // o programa que fez.
        $patient = $this->makePatient(['status' => Patient::STATUS_ALTA]);

        $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => self::CPF,
            'clinic_id'  => $patient->clinic_id,
        ])->assertStatus(200);
    }

    public function test_paciente_removido_nao_autentica(): void
    {
        $patient  = $this->makePatient();
        $clinicId = $patient->clinic_id;
        $patient->delete();

        $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => self::CPF,
            'clinic_id'  => $clinicId,
        ])->assertStatus(401);
    }

    // ---------------------------------------------------------------- SC-006

    public function test_falhas_sao_indistinguiveis(): void
    {
        $patient = $this->makePatient();

        $inexistente = $this->postJson(self::ENDPOINT, [
            'identifier' => '00000000000',
            'password'   => 'qualquer',
            'clinic_id'  => $patient->clinic_id,
        ]);

        $senhaErrada = $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => 'errada',
            'clinic_id'  => $patient->clinic_id,
        ]);

        $clinicaInexistente = $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => self::CPF,
            'clinic_id'  => 999999,
        ]);

        $this->assertSame(401, $inexistente->status());
        $this->assertSame(401, $senhaErrada->status());
        $this->assertSame(401, $clinicaInexistente->status());

        $this->assertSame($inexistente->json(), $senhaErrada->json());
        $this->assertSame($inexistente->json(), $clinicaInexistente->json());
    }

    // ---------------------------------------------------------------- SC-003

    public function test_mesmo_cpf_em_duas_clinicas_autentica_identidades_distintas(): void
    {
        $clinicaA = Clinic::factory()->create();
        $clinicaB = Clinic::factory()->create();

        $pacienteA = $this->makePatient(['clinic' => $clinicaA]);
        $pacienteB = $this->makePatient(['clinic' => $clinicaB]);

        $respostaA = $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => self::CPF,
            'clinic_id'  => $clinicaA->id,
        ]);

        RateLimiter::clear('cpf:' . self::CPF . '|127.0.0.1');

        $respostaB = $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => self::CPF,
            'clinic_id'  => $clinicaB->id,
        ]);

        $respostaA->assertStatus(200);
        $respostaB->assertStatus(200);

        $this->assertSame($pacienteA->id, $respostaA->json('user.id'));
        $this->assertSame($pacienteB->id, $respostaB->json('user.id'));
        $this->assertNotSame($respostaA->json('user.id'), $respostaB->json('user.id'));
    }

    // ---------------------------------------------------------------- SC-012

    public function test_senha_nao_aparece_na_resposta(): void
    {
        $patient = $this->makePatient();

        $response = $this->postJson(self::ENDPOINT, [
            'identifier' => self::CPF,
            'password'   => self::CPF,
            'clinic_id'  => $patient->clinic_id,
        ]);

        $response->assertStatus(200);
        $this->assertArrayNotHasKey('password', $response->json('user'));

        // Nem o hash nem a senha em claro podem sair no corpo da resposta.
        $this->assertStringNotContainsString('password', $response->getContent());
        $this->assertStringNotContainsString($patient->getAuthPassword(), $response->getContent());
    }
}
