<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class CancelledClinicAccessTest extends TestCase
{
    use RefreshDatabase;

    private const CANCELLED_LOGIN_MESSAGE = 'A clínica está cancelada. Fale com o suporte.';

    private AdminUser $operator;

    private Clinic $clinic;

    private ClinicUser $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->operator = AdminUser::factory()->create();
        $this->clinic   = Clinic::factory()->create();
        $this->admin    = $this->userOf($this->clinic);
    }

    public function test_user_of_a_cancelled_clinic_with_the_right_password_gets_403_without_token(): void
    {
        $this->cancel($this->clinic);

        $this->login($this->admin)
            ->assertForbidden()
            ->assertJson(['message' => self::CANCELLED_LOGIN_MESSAGE])
            ->assertJsonMissingPath('access_token');
    }

    public function test_user_of_a_cancelled_clinic_with_the_wrong_password_gets_the_usual_401(): void
    {
        $this->cancel($this->clinic);

        $this->login($this->admin, 'senha-errada')
            ->assertUnauthorized()
            ->assertJson(['message' => 'Credenciais inválidas.']);
    }

    public function test_token_issued_before_the_cancellation_gets_401_on_me_on_a_clinic_route_and_on_refresh(): void
    {
        $token = $this->tokenFor($this->admin);
        $this->asBearer($token)->getJson('/api/clinic/profile')->assertOk();

        $this->cancel($this->clinic);

        $this->asBearer($token)->getJson('/api/clinic/auth/me')->assertUnauthorized();
        $this->asBearer($token)->getJson('/api/clinic/profile')->assertUnauthorized();
        $this->asBearer($token)->postJson('/api/clinic/auth/refresh')->assertUnauthorized();
    }

    public function test_an_inactive_clinic_still_logs_in_and_the_operator_still_logs_in_as_it(): void
    {
        $this->clinic->forceFill(['status' => Clinic::STATUS_INACTIVE])->save();

        $token = $this->login($this->admin)->assertOk()->json('access_token');

        $this->asBearer($token)->getJson('/api/clinic/auth/me')->assertOk()->assertJsonPath('id', $this->admin->id);
        $this->asOperator()->postJson("/api/admin/clinics/{$this->clinic->id}/login-as")->assertOk();
    }

    public function test_checking_the_clinic_status_does_not_add_the_clinic_to_the_user_json(): void
    {
        $login = $this->login($this->admin)->assertOk()->assertJsonMissingPath('user.clinic');

        $this->asBearer($login->json('access_token'))
            ->getJson('/api/clinic/auth/me')
            ->assertOk()
            ->assertJsonMissingPath('clinic');
    }

    public function test_the_clinic_profile_ignores_status(): void
    {
        $token = $this->tokenFor($this->masterOf($this->clinic));

        $this->asBearer($token)->putJson('/api/clinic/profile', [
            'name'        => 'Clínica Que Tentou Se Cancelar',
            'email'       => 'contato@cancelar.test',
            'document'    => '11222333000181',
            'type_person' => Clinic::TYPE_PERSON_JURIDICA,
            'status'      => Clinic::STATUS_CANCELLED,
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Clínica Que Tentou Se Cancelar')
            ->assertJsonPath('data.status', Clinic::STATUS_ACTIVE);

        $this->assertSame(Clinic::STATUS_ACTIVE, $this->clinic->fresh()->status);
    }

    public function test_the_operator_cannot_log_in_as_a_cancelled_clinic(): void
    {
        $this->cancel($this->clinic);

        $this->asOperator()
            ->postJson("/api/admin/clinics/{$this->clinic->id}/login-as")
            ->assertUnprocessable()
            ->assertJson(['message' => 'A clínica está cancelada. Reative-a para entrar.'])
            ->assertJsonMissingPath('access_token');
    }

    public function test_the_first_access_link_of_a_cancelled_clinic_gives_the_generic_422_and_keeps_the_password(): void
    {
        $master = $this->masterOf($this->clinic);
        $url    = $this->asOperator()
            ->postJson("/api/admin/clinics/{$this->clinic->id}/first-access-link")
            ->assertOk()
            ->json('data.url');
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);
        $passwordBefore = $master->fresh()->getAuthPassword();

        $this->cancel($this->clinic);

        $this->asGuest()->postJson('/api/clinic/auth/first-access', [
            'token'                 => $query['token'],
            'password'              => 'senhaDoMestre1',
            'password_confirmation' => 'senhaDoMestre1',
        ])
            ->assertUnprocessable()
            ->assertJson(['message' => 'Link inválido ou já usado. Peça um novo link ao suporte.'])
            ->assertJsonMissingPath('access_token');

        $master->refresh();
        $this->assertSame($passwordBefore, $master->getAuthPassword());
        $this->assertNull($master->password_changed_at);
    }

    public function test_reactivating_by_the_operator_gives_the_access_back(): void
    {
        $this->asOperator()->deleteJson("/api/admin/clinics/{$this->clinic->id}")->assertOk();
        $this->login($this->admin)->assertForbidden();

        $this->asOperator()->putJson("/api/admin/clinics/{$this->clinic->id}/reactivate")->assertOk();

        $token = $this->login($this->admin)->assertOk()->json('access_token');
        $this->asBearer($token)->getJson('/api/clinic/auth/me')->assertOk()->assertJsonPath('id', $this->admin->id);
        $this->asOperator()->postJson("/api/admin/clinics/{$this->clinic->id}/login-as")->assertOk();
    }

    public function test_cancelling_clinic_a_does_not_touch_clinic_b_and_clinic_b_cannot_change_a_status(): void
    {
        $clinicB = Clinic::factory()->create();
        $userB   = $this->userOf($clinicB);
        $tokenB  = $this->tokenFor($userB);

        $this->cancel($this->clinic);

        $this->asBearer($tokenB)->getJson('/api/clinic/auth/me')->assertOk()->assertJsonPath('id', $userB->id);
        $this->login($userB)->assertOk();

        $this->asBearer($this->tokenFor($this->masterOf($clinicB)))->putJson('/api/clinic/profile', [
            'id'          => $this->clinic->id,
            'clinic_id'   => $this->clinic->id,
            'name'        => 'Clínica B',
            'email'       => 'contato@clinica-b.test',
            'document'    => '11444777000161',
            'type_person' => Clinic::TYPE_PERSON_JURIDICA,
            'status'      => Clinic::STATUS_ACTIVE,
        ])->assertOk()->assertJsonPath('data.id', $clinicB->id);

        $this->assertSame(Clinic::STATUS_CANCELLED, $this->clinic->fresh()->status);
        $this->assertSame(Clinic::STATUS_ACTIVE, $clinicB->fresh()->status);
    }

    private function cancel(Clinic $clinic): void
    {
        $clinic->forceFill(['status' => Clinic::STATUS_CANCELLED])->save();
    }

    private function login(ClinicUser $user, string $password = 'password'): TestResponse
    {
        return $this->asGuest()->postJson('/api/clinic/auth/login', [
            'email'    => $user->email,
            'password' => $password,
        ]);
    }

    private function masterOf(Clinic $clinic): ClinicUser
    {
        return ClinicUser::where('clinic_id', $clinic->id)->where('mestre', ClinicUser::MESTRE_YES)->firstOrFail();
    }

    private function userOf(Clinic $clinic, string $role = ClinicUser::ROLE_ADMIN): ClinicUser
    {
        return ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => $role,
            'mestre'    => ClinicUser::MESTRE_NO,
            'status'    => ClinicUser::STATUS_ACTIVE,
        ]);
    }

    private function tokenFor(ClinicUser $user): string
    {
        $token = auth('clinic')->login($user);
        $this->forgetSession();

        return $token;
    }

    private function asBearer(string $token): static
    {
        $this->forgetSession();

        return $this->withToken($token);
    }

    private function asOperator(): static
    {
        $this->forgetSession();

        return $this->actingAs($this->operator, 'admin');
    }

    private function asGuest(): static
    {
        $this->forgetSession();

        return $this->withHeaders(['Authorization' => '']);
    }

    /** O guard e o JWT da lib guardam o usuário e o token da requisição anterior. */
    private function forgetSession(): void
    {
        $this->app['auth']->forgetGuards();
        $this->app['tymon.jwt']->unsetToken();
    }
}
