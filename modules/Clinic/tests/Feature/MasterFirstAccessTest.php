<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class MasterFirstAccessTest extends TestCase
{
    use RefreshDatabase;

    private const DOCUMENT = '11.222.333/0001-81';

    private AdminUser $operator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->operator = AdminUser::factory()->create();
    }

    public function test_master_of_a_clinic_created_by_the_operator_cannot_log_in_with_the_document(): void
    {
        $email = $this->createClinicAsOperator()->email;

        foreach ([self::DOCUMENT, '11222333000181'] as $password) {
            $this->asGuest()
                ->postJson('/api/clinic/auth/login', ['email' => $email, 'password' => $password])
                ->assertUnauthorized();
        }
    }

    public function test_the_link_sets_the_password_and_opens_the_session(): void
    {
        $clinic = $this->createClinicAsOperator();
        $master = $this->masterOf($clinic);

        $url = $this->asOperator()
            ->postJson("/api/admin/clinics/{$clinic->id}/first-access-link")
            ->assertOk()
            ->assertJsonStructure(['data' => ['url', 'created_at']])
            ->json('data.url');

        $this->assertStringStartsWith(rtrim((string) config('app.url'), '/') . '/clinica/primeiro-acesso?token=', $url);

        $session = $this->asGuest()
            ->postJson('/api/clinic/auth/first-access', [
                'token'                 => $this->tokenFrom($url),
                'password'              => 'senhaDoMestre1',
                'password_confirmation' => 'senhaDoMestre1',
            ])
            ->assertOk()
            ->assertJsonPath('token_type', 'bearer')
            ->assertJsonPath('user.id', $master->id)
            ->assertJsonMissingPath('user.first_access_token_hash')
            ->json();

        $this->asBearer($session['access_token'])->getJson('/api/clinic/auth/me')
            ->assertOk()
            ->assertJsonPath('id', $master->id);
        $this->assertNotNull($master->fresh()->password_changed_at);
        $this->asGuest()
            ->postJson('/api/clinic/auth/login', ['email' => $clinic->email, 'password' => 'senhaDoMestre1'])
            ->assertOk();
    }

    public function test_the_same_link_does_not_work_twice(): void
    {
        $clinic = $this->createClinicAsOperator();
        $token  = $this->generateToken($clinic);

        $this->completeFirstAccess($token, 'senhaDoMestre1')->assertOk();

        $this->completeFirstAccess($token, 'outraSenha123')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Link inválido ou já usado. Peça um novo link ao suporte.')
            ->assertJsonMissingPath('errors');
        $this->asGuest()
            ->postJson('/api/clinic/auth/login', ['email' => $clinic->email, 'password' => 'outraSenha123'])
            ->assertUnauthorized();
    }

    public function test_a_new_link_invalidates_the_previous_one(): void
    {
        $clinic   = $this->createClinicAsOperator();
        $previous = $this->generateToken($clinic);
        $current  = $this->generateToken($clinic);

        $this->completeFirstAccess($previous, 'senhaDoMestre1')->assertUnprocessable();
        $this->completeFirstAccess($current, 'senhaDoMestre1')->assertOk();
    }

    public function test_the_link_for_a_master_with_password_replaces_it_and_revokes_the_old_session(): void
    {
        $clinic = $this->createClinicAsOperator();
        $this->completeFirstAccess($this->generateToken($clinic), 'senhaDoMestre1')->assertOk();
        $oldToken = $this->asGuest()
            ->postJson('/api/clinic/auth/login', ['email' => $clinic->email, 'password' => 'senhaDoMestre1'])
            ->assertOk()
            ->json('access_token');
        $this->travel(1)->seconds();

        $this->completeFirstAccess($this->generateToken($clinic), 'senhaNovaDoMestre2')->assertOk();

        $this->asBearer($oldToken)->getJson('/api/clinic/auth/me')->assertUnauthorized();
        $this->asGuest()
            ->postJson('/api/clinic/auth/login', ['email' => $clinic->email, 'password' => 'senhaDoMestre1'])
            ->assertUnauthorized();
        $this->asGuest()
            ->postJson('/api/clinic/auth/login', ['email' => $clinic->email, 'password' => 'senhaNovaDoMestre2'])
            ->assertOk();
    }

    public function test_a_clinic_user_cannot_generate_a_link_even_for_another_clinic(): void
    {
        $clinicA = $this->createClinicAsOperator();
        $clinicB = Clinic::factory()->create();
        $tokenB  = auth('clinic')->login($this->masterOf($clinicB));

        foreach ([$clinicA, $clinicB] as $clinic) {
            $this->asBearer($tokenB)
                ->postJson("/api/admin/clinics/{$clinic->id}/first-access-link")
                ->assertUnauthorized();
        }

        $this->assertNull($this->masterOf($clinicA)->first_access_token_hash);
    }

    public function test_an_unknown_clinic_gives_404(): void
    {
        $this->asOperator()->postJson('/api/admin/clinics/999999/first-access-link')->assertNotFound();
    }

    public function test_a_clinic_without_an_active_master_gives_422(): void
    {
        $clinic = $this->createClinicAsOperator();
        $master = $this->masterOf($clinic);
        $master->forceFill(['status' => ClinicUser::STATUS_INACTIVE])->save();

        $this->asOperator()->postJson("/api/admin/clinics/{$clinic->id}/first-access-link")->assertUnprocessable();

        $master->delete();

        $this->asOperator()->postJson("/api/admin/clinics/{$clinic->id}/first-access-link")->assertUnprocessable();
        $this->assertNull($master->fresh()->first_access_token_hash);
    }

    public function test_the_link_of_clinic_a_only_touches_the_master_of_clinic_a(): void
    {
        $clinicA       = $this->createClinicAsOperator();
        $clinicB       = Clinic::factory()->create();
        $masterB       = $this->masterOf($clinicB);
        $passwordHashB = $masterB->password;
        $tokenB        = $this->generateToken($clinicB);

        $session = $this->completeFirstAccess($this->generateToken($clinicA), 'senhaDoMestre1')
            ->assertOk()
            ->json();

        $this->assertSame($this->masterOf($clinicA)->id, $session['user']['id']);
        $this->assertSame($clinicA->id, $session['user']['clinic_id']);
        $masterB->refresh();
        $this->assertSame($passwordHashB, $masterB->password);
        $this->assertNull($masterB->password_changed_at);
        $this->assertNotNull($masterB->first_access_token_hash);
        $this->completeFirstAccess($tokenB, 'senhaDoMestreB1')->assertOk()->assertJsonPath('user.id', $masterB->id);
    }

    public function test_a_non_master_user_with_a_token_hash_cannot_use_it(): void
    {
        $clinic = $this->createClinicAsOperator();
        $physio = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'mestre'    => ClinicUser::MESTRE_NO,
            'status'    => ClinicUser::STATUS_ACTIVE,
        ]);
        $physio->forceFill(['first_access_token_hash' => hash('sha256', 'token-do-fisio')])->save();

        $this->completeFirstAccess('token-do-fisio', 'senhaDoFisio1')->assertUnprocessable();
    }

    public function test_the_clinic_detail_tells_the_operator_the_master_access_state(): void
    {
        $this->freezeSecond();
        $clinic = $this->createClinicAsOperator();

        $this->asOperator()->getJson("/api/admin/clinics/{$clinic->id}")
            ->assertOk()
            ->assertJsonPath('data.master_password_defined', false)
            ->assertJsonPath('data.first_access_link_created_at', null);

        $createdAt = $this->asOperator()->postJson("/api/admin/clinics/{$clinic->id}/first-access-link")->json('data.created_at');

        $this->asOperator()->getJson("/api/admin/clinics/{$clinic->id}")
            ->assertJsonPath('data.master_password_defined', false)
            ->assertJsonPath('data.first_access_link_created_at', $createdAt);

        $this->completeFirstAccess($this->generateToken($clinic), 'senhaDoMestre1')->assertOk();

        $this->asOperator()->getJson("/api/admin/clinics/{$clinic->id}")
            ->assertJsonPath('data.master_password_defined', true)
            ->assertJsonPath('data.first_access_link_created_at', null);
    }

    public function test_the_link_confirms_the_email_of_a_self_registered_master_who_never_confirmed_it(): void
    {
        \Illuminate\Support\Facades\Queue::fake();
        $clinicId = $this->asGuest()->postJson('/api/clinic/auth/register', [
            'name'                  => 'Clínica Sem Confirmar',
            'type_person'           => Clinic::TYPE_PERSON_JURIDICA,
            'document'              => '11444777000161',
            'email'                 => 'sem-confirmar@clinica.test',
            'phone'                 => '11987654321',
            'slug'                  => 'clinica-sem-confirmar',
            'password'              => 'SenhaEsquecida!1',
            'password_confirmation' => 'SenhaEsquecida!1',
            'terms_accepted'        => true,
        ])->assertCreated()->json('data.clinic_id');
        $clinic = Clinic::findOrFail($clinicId);
        $this->assertNull($this->masterOf($clinic)->email_verified_at);

        $this->completeFirstAccess($this->generateToken($clinic), 'senhaDoMestre1')->assertOk();

        $this->assertNotNull($this->masterOf($clinic)->email_verified_at);
        $this->asGuest()
            ->postJson('/api/clinic/auth/login', ['email' => $clinic->email, 'password' => 'senhaDoMestre1'])
            ->assertOk();
    }

    public function test_changing_the_password_another_way_kills_the_pending_link(): void
    {
        $clinic = $this->createClinicAsOperator();
        $master = $this->masterOf($clinic);
        $token  = $this->generateToken($clinic);

        $this->asGuest()->postJson('/api/clinic/auth/reset-password', [
            'token'                 => \Illuminate\Support\Facades\Password::broker('clinic_users')->createToken($master),
            'email'                 => $master->email,
            'password'              => 'senhaDoReset1',
            'password_confirmation' => 'senhaDoReset1',
        ])->assertOk();

        $this->completeFirstAccess($token, 'senhaDoLink1')->assertUnprocessable();
        $this->assertNull($master->fresh()->first_access_token_created_at);
        $this->asGuest()
            ->postJson('/api/clinic/auth/login', ['email' => $clinic->email, 'password' => 'senhaDoReset1'])
            ->assertOk();
    }

    public function test_the_link_date_stays_out_of_the_clinic_user_json(): void
    {
        $clinic  = $this->createClinicAsOperator();
        $session = $this->completeFirstAccess($this->generateToken($clinic), 'senhaDoMestre1')->json('access_token');
        $this->generateToken($clinic);

        $this->asBearer($session)->getJson('/api/clinic/auth/me')
            ->assertOk()
            ->assertJsonMissingPath('first_access_token_created_at')
            ->assertJsonMissingPath('first_access_token_hash');
    }

    private function generateToken(Clinic $clinic): string
    {
        return $this->tokenFrom(
            $this->asOperator()->postJson("/api/admin/clinics/{$clinic->id}/first-access-link")->assertOk()->json('data.url'),
        );
    }

    private function completeFirstAccess(string $token, string $password): \Illuminate\Testing\TestResponse
    {
        return $this->asGuest()->postJson('/api/clinic/auth/first-access', [
            'token'                 => $token,
            'password'              => $password,
            'password_confirmation' => $password,
        ]);
    }

    private function tokenFrom(string $url): string
    {
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        return (string) $query['token'];
    }

    private function createClinicAsOperator(): Clinic
    {
        $id = $this->asOperator()->postJson('/api/admin/clinics', [
            'name'        => 'Clínica Primeiro Acesso',
            'email'       => 'mestre@primeiro-acesso.test',
            'document'    => self::DOCUMENT,
            'type_person' => Clinic::TYPE_PERSON_JURIDICA,
            'slug'        => 'clinica-primeiro-acesso',
        ])->assertCreated()->json('data.id');

        return Clinic::findOrFail($id);
    }

    private function masterOf(Clinic $clinic): ClinicUser
    {
        return ClinicUser::where('clinic_id', $clinic->id)->where('mestre', ClinicUser::MESTRE_YES)->firstOrFail();
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

    private function asBearer(string $token): static
    {
        $this->forgetSession();

        return $this->withToken($token);
    }

    /** O guard e o JWT da lib guardam o usuário e o token da requisição anterior. */
    private function forgetSession(): void
    {
        $this->app['auth']->forgetGuards();
        $this->app['tymon.jwt']->unsetToken();
    }
}
