<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Contracts\ClinicImpersonationServiceInterface;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class LoginAsAuditTest extends TestCase
{
    use RefreshDatabase;

    private AdminUser $operator;

    private Clinic $clinic;

    private ClinicUser $master;

    protected function setUp(): void
    {
        parent::setUp();

        $this->operator = AdminUser::factory()->create(['name' => 'Operadora Ana']);
        $this->clinic   = Clinic::factory()->create();
        $this->master   = $this->masterOf($this->clinic);
    }

    public function test_a_successful_login_as_records_operator_clinic_user_ip_and_date(): void
    {
        $this->freezeSecond();

        $this->loginAs($this->clinic, ['REMOTE_ADDR' => '203.0.113.7', 'HTTP_USER_AGENT' => 'Navegador QA'])
            ->assertOk();

        $this->assertDatabaseCount('admin_login_as_audits', 1);
        $this->assertDatabaseHas('admin_login_as_audits', [
            'admin_user_id'  => $this->operator->id,
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->master->id,
            'ip'             => '203.0.113.7',
            'user_agent'     => 'Navegador QA',
            'created_at'     => now(),
        ]);
    }

    public function test_a_refused_login_as_records_nothing(): void
    {
        $withoutAdmin = Clinic::factory()->create();
        $this->masterOf($withoutAdmin)->forceFill(['status' => ClinicUser::STATUS_INACTIVE])->save();
        $cancelled = Clinic::factory()->create(['status' => Clinic::STATUS_CANCELLED]);

        $this->loginAs($withoutAdmin)->assertUnprocessable();
        $this->loginAs($cancelled)->assertUnprocessable();
        $this->forgetSession();
        $this->actingAs($this->operator, 'admin')->postJson('/api/admin/clinics/999999/login-as')->assertNotFound();

        $this->assertDatabaseCount('admin_login_as_audits', 0);
    }

    public function test_the_token_says_who_is_impersonating_and_works_in_the_clinic(): void
    {
        $token = $this->loginAs($this->clinic)->assertOk()->json('access_token');

        $payload = json_decode(base64_decode(strtr(explode('.', $token)[1], '-_', '+/')), true);
        $this->assertSame($this->operator->id, $payload['impersonated_by']);

        $this->forgetSession();
        $this->withToken($token)->getJson('/api/clinic/auth/me')->assertOk()->assertJsonPath('id', $this->master->id);
    }

    public function test_the_clinic_detail_brings_the_last_ten_login_as_of_that_clinic_most_recent_first(): void
    {
        $otherOperator = AdminUser::factory()->create(['name' => 'Operador Bruno']);
        $otherClinic   = Clinic::factory()->create();
        $start         = now()->startOfSecond();

        for ($i = 0; $i < 11; $i++) {
            $this->travelTo($start->copy()->addMinutes($i));
            $this->loginAs($this->clinic)->assertOk();
        }
        $this->travelTo($start->copy()->addMinutes(20));
        $this->forgetSession();
        $this->actingAs($otherOperator, 'admin')->postJson("/api/admin/clinics/{$otherClinic->id}/login-as")->assertOk();
        $this->travelTo($start->copy()->addMinutes(30));

        $recent = $this->showAsOperator($this->clinic)->assertOk()->json('data.recent_login_as');

        $this->assertCount(10, $recent);
        $this->assertSame([
            'operator_name'    => 'Operadora Ana',
            'clinic_user_name' => $this->master->name,
            'created_at'       => $start->copy()->addMinutes(10)->toIso8601String(),
        ], $recent[0]);
        $this->assertSame($start->copy()->addMinutes(1)->toIso8601String(), $recent[9]['created_at']);
        $this->assertNotContains('Operador Bruno', array_column($recent, 'operator_name'));

        $this->assertSame(
            [['operator_name' => 'Operador Bruno', 'clinic_user_name' => $this->masterOf($otherClinic)->name, 'created_at' => $start->copy()->addMinutes(20)->toIso8601String()]],
            $this->showAsOperator($otherClinic)->json('data.recent_login_as'),
        );
    }

    public function test_the_user_name_only_comes_from_the_requested_clinic(): void
    {
        $outsider = $this->masterOf(Clinic::factory()->create());
        DB::table('admin_login_as_audits')->insert([
            'admin_user_id'  => $this->operator->id,
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $outsider->id,
            'created_at'     => now(),
        ]);

        $this->showAsOperator($this->clinic)
            ->assertOk()
            ->assertJsonPath('data.recent_login_as.0.clinic_user_name', null)
            ->assertDontSee($outsider->name);
    }

    public function test_the_name_of_a_user_deleted_later_still_shows(): void
    {
        $this->loginAs($this->clinic)->assertOk();
        $this->master->delete();

        $this->showAsOperator($this->clinic)
            ->assertOk()
            ->assertJsonPath('data.recent_login_as.0.clinic_user_name', $this->master->name);
    }

    public function test_a_long_user_agent_is_cut_to_the_column_size(): void
    {
        $this->loginAs($this->clinic, ['HTTP_USER_AGENT' => str_repeat('a', 600)])->assertOk();

        $this->assertSame(512, mb_strlen((string) DB::table('admin_login_as_audits')->value('user_agent')));
    }

    public function test_nothing_is_recorded_when_the_token_cannot_be_issued(): void
    {
        $impersonation = $this->app->make(ClinicImpersonationServiceInterface::class);

        try {
            $impersonation->impersonate($this->clinic->id, $this->operator->id, '203.0.113.7', 'Navegador QA', function (): string {
                throw new \RuntimeException('falha ao emitir o token');
            });
            $this->fail('A falha ao emitir o token devia subir.');
        } catch (\RuntimeException $e) {
            $this->assertSame('falha ao emitir o token', $e->getMessage());
        }

        $this->assertDatabaseCount('admin_login_as_audits', 0);
    }

    public function test_a_clinic_user_cannot_read_or_create_the_record_even_for_another_clinic(): void
    {
        $this->loginAs($this->clinic)->assertOk();
        $clinicB = Clinic::factory()->create();
        $tokenB  = auth('clinic')->login($this->masterOf($clinicB));

        $this->forgetSession();
        $this->withToken($tokenB)->getJson("/api/admin/clinics/{$this->clinic->id}")->assertUnauthorized();
        $this->forgetSession();
        $this->withToken($tokenB)->postJson("/api/admin/clinics/{$this->clinic->id}/login-as")->assertUnauthorized();

        $this->assertDatabaseCount('admin_login_as_audits', 1);
    }

    public function test_no_clinic_route_returns_the_record(): void
    {
        $token = $this->loginAs($this->clinic)->assertOk()->json('access_token');

        foreach (['/api/clinic/auth/me', '/api/clinic/profile', "/api/clinic/users/{$this->master->id}"] as $path) {
            $this->forgetSession();
            $response = $this->withToken($token)->getJson($path)->assertOk();
            $this->assertStringNotContainsString('login_as', $response->getContent(), $path);
            $this->assertStringNotContainsString('Operadora Ana', $response->getContent(), $path);
        }
    }

    private function showAsOperator(Clinic $clinic): TestResponse
    {
        $this->forgetSession();

        return $this->actingAs($this->operator, 'admin')->getJson("/api/admin/clinics/{$clinic->id}");
    }

    /**
     * @param  array<string, string>  $server
     */
    private function loginAs(Clinic $clinic, array $server = []): TestResponse
    {
        $this->forgetSession();

        return $this->actingAs($this->operator, 'admin')
            ->withServerVariables($server)
            ->postJson("/api/admin/clinics/{$clinic->id}/login-as");
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
