<?php

namespace Modules\Patient\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Tests\Support\CreatesPatientProgramFixtures;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class IneligiblePatientTokenTest extends TestCase
{
    use CreatesPatientProgramFixtures;
    use RefreshDatabase;

    private const CPF = '52998224725';

    private Patient $patient;

    private string $planToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpPatientProgramFixtures();

        $this->patient   = $this->createPatient(['cpf' => self::CPF, 'password' => self::CPF]);
        $this->planToken = $this->createActiveProgram($this->patient)['plan']->public_token;
    }

    public function test_token_issued_before_the_clinic_inactivates_the_patient_gets_401_on_me_programs_and_refresh(): void
    {
        $token = $this->loginToken($this->patient);
        $this->asPatient($token)->getJson('/api/patient/auth/me')->assertOk();

        $this->asClinicUser($this->clinicUser)
            ->postJson('/api/clinic/patients/bulk-inactivate', ['ids' => [$this->patient->id]])
            ->assertOk()
            ->assertJsonPath('count', 1);

        $this->asPatient($token)->getJson('/api/patient/auth/me')->assertUnauthorized();
        $this->asPatient($token)->getJson('/api/patient/programs')->assertUnauthorized();
        $this->asPatient($token)->postJson('/api/patient/auth/refresh')
            ->assertUnauthorized()
            ->assertJsonMissingPath('access_token');
    }

    /**
     * @return array<string, array{string}>
     */
    public static function blockedStatuses(): array
    {
        return [
            'obito'     => [Patient::STATUS_OBITO],
            'cancelado' => [Patient::STATUS_CANCELADO],
        ];
    }

    #[DataProvider('blockedStatuses')]
    public function test_token_issued_before_the_clinic_sets_a_blocked_status_gets_401(string $status): void
    {
        $token = $this->loginToken($this->patient);

        $this->asClinicUser($this->clinicUser)
            ->putJson("/api/clinic/patients/{$this->patient->id}", ['status' => $status])
            ->assertOk()
            ->assertJsonPath('data.status', $status);

        $this->asPatient($token)->getJson('/api/patient/auth/me')->assertUnauthorized();
        $this->asPatient($token)->getJson('/api/patient/programs')->assertUnauthorized();
        $this->asPatient($token)->postJson('/api/patient/auth/refresh')->assertUnauthorized();
    }

    public function test_inactivated_patient_still_gets_401_on_login(): void
    {
        $this->asClinicUser($this->clinicUser)
            ->postJson('/api/clinic/patients/bulk-inactivate', ['ids' => [$this->patient->id]])
            ->assertOk();

        $this->login($this->patient)
            ->assertUnauthorized()
            ->assertJson(['message' => 'Credenciais inválidas.'])
            ->assertJsonMissingPath('access_token');
    }

    public function test_token_renewed_before_the_inactivation_also_gets_401(): void
    {
        $renewed = $this->asPatient($this->loginToken($this->patient))
            ->postJson('/api/patient/auth/refresh')
            ->assertOk()
            ->json('access_token');

        $this->asClinicUser($this->clinicUser)
            ->postJson('/api/clinic/patients/bulk-inactivate', ['ids' => [$this->patient->id]])
            ->assertOk();

        $this->asPatient($renewed)->getJson('/api/patient/auth/me')->assertUnauthorized();
        $this->asPatient($renewed)->postJson('/api/patient/auth/refresh')->assertUnauthorized();
    }

    public function test_reactivated_patient_gets_the_open_session_back(): void
    {
        $token = $this->loginToken($this->patient);

        $this->asClinicUser($this->clinicUser)
            ->postJson('/api/clinic/patients/bulk-inactivate', ['ids' => [$this->patient->id]])
            ->assertOk();
        $this->asPatient($token)->getJson('/api/patient/auth/me')->assertUnauthorized();

        $this->asClinicUser($this->clinicUser)
            ->postJson("/api/clinic/patients/{$this->patient->id}/reactivate")
            ->assertOk();

        $this->assertTokenStillWorks($token);
    }

    public function test_user_of_another_clinic_cannot_inactivate_the_patient_nor_cut_the_token(): void
    {
        $token = $this->loginToken($this->patient);
        $other = ClinicUser::factory()->create();

        $this->asClinicUser($other)
            ->postJson('/api/clinic/patients/bulk-inactivate', ['ids' => [$this->patient->id]])
            ->assertOk()
            ->assertJsonPath('count', 0);
        $this->asClinicUser($other)
            ->putJson("/api/clinic/patients/{$this->patient->id}", ['status' => Patient::STATUS_OBITO])
            ->assertNotFound();

        $this->assertDatabaseHas('patients', [
            'id'        => $this->patient->id,
            'is_active' => true,
            'status'    => 'em_tratamento',
        ]);
        $this->assertTokenStillWorks($token);
    }

    public function test_inactivating_the_same_cpf_in_another_clinic_cuts_only_that_patient(): void
    {
        $other        = ClinicUser::factory()->create();
        $samePerson   = Patient::factory()->create([
            'clinic_id' => $other->clinic_id,
            'cpf'       => self::CPF,
            'password'  => self::CPF,
        ]);
        $token        = $this->loginToken($this->patient);
        $tokenInOther = $this->loginToken($samePerson);

        $this->asClinicUser($other)
            ->postJson('/api/clinic/patients/bulk-inactivate', ['ids' => [$samePerson->id]])
            ->assertOk()
            ->assertJsonPath('count', 1);

        $this->asPatient($tokenInOther)->getJson('/api/patient/auth/me')->assertUnauthorized();
        $this->assertTokenStillWorks($token);
    }

    public function test_active_patient_keeps_200_on_me_programs_and_refresh(): void
    {
        $this->assertTokenStillWorks($this->loginToken($this->patient));
    }

    public function test_patient_discharged_keeps_200_like_the_login(): void
    {
        $token = $this->loginToken($this->patient);

        $this->asClinicUser($this->clinicUser)
            ->putJson("/api/clinic/patients/{$this->patient->id}", ['status' => Patient::STATUS_ALTA])
            ->assertOk();

        $this->assertTokenStillWorks($token);
    }

    private function assertTokenStillWorks(string $token): void
    {
        $this->asPatient($token)->getJson('/api/patient/auth/me')
            ->assertOk()
            ->assertJsonPath('id', $this->patient->id);
        $this->asPatient($token)->getJson('/api/patient/programs')
            ->assertOk()
            ->assertJsonPath('data.0.public_token', $this->planToken);

        $renewed = $this->asPatient($token)->postJson('/api/patient/auth/refresh')
            ->assertOk()
            ->json('access_token');

        $this->assertNotEmpty($renewed);
        $this->asPatient($renewed)->getJson('/api/patient/auth/me')
            ->assertOk()
            ->assertJsonPath('id', $this->patient->id);
    }

    private function loginToken(Patient $patient): string
    {
        return $this->login($patient)->assertOk()->json('access_token');
    }

    private function login(Patient $patient): TestResponse
    {
        $this->freshGuards();

        return $this->postJson('/api/patient/auth/login', [
            'identifier' => self::CPF,
            'password'   => self::CPF,
            'clinic_id'  => $patient->clinic_id,
        ]);
    }

    private function asPatient(string $token): static
    {
        $this->freshGuards();

        return $this->withToken($token);
    }

    private function asClinicUser(ClinicUser $user): static
    {
        $this->freshGuards();

        return $this->actingAs($user, 'clinic');
    }

    private function freshGuards(): void
    {
        $this->flushHeaders();
        $this->app['auth']->forgetGuards();
        $this->app['tymon.jwt']->unsetToken();
        $this->app['tymon.jwt.auth']->unsetToken();
    }
}
