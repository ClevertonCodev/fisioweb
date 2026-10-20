<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

/**
 * Excluir é soft delete: a pessoa sai da equipe e perde o acesso, mas a
 * agenda, o financeiro e o histórico dela continuam, com o nome.
 */
class ClinicUserDeletionTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $master;

    private ClinicUser $physio;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic = Clinic::factory()->create();
        $this->master = ClinicUser::where('clinic_id', $this->clinic->id)
            ->where('mestre', ClinicUser::MESTRE_YES)
            ->firstOrFail();
        $this->physio = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'mestre'    => ClinicUser::MESTRE_NO,
            'name'      => 'Fisio Que Saiu',
        ]);
    }

    public function test_delete_keeps_the_record_and_the_agenda(): void
    {
        $startsAt    = now()->addDay()->setTime(10, 0);
        $appointment = Appointment::factory()->create([
            'clinic_id'      => $this->clinic->id,
            'patient_id'     => Patient::factory()->create(['clinic_id' => $this->clinic->id])->id,
            'clinic_user_id' => $this->physio->id,
            'starts_at'      => $startsAt,
            'ends_at'        => (clone $startsAt)->addHour(),
        ]);

        $this->actingAs($this->master, 'clinic')
            ->deleteJson("/api/clinic/users/{$this->physio->id}")
            ->assertOk();

        $this->assertSoftDeleted('clinic_users', ['id' => $this->physio->id]);
        $this->assertDatabaseHas('clinic_appointments', ['id' => $appointment->id]);

        $ids = collect($this->actingAs($this->master, 'clinic')
            ->getJson('/api/clinic/users')
            ->assertOk()
            ->json('data'))->pluck('id');
        $this->assertNotContains($this->physio->id, $ids);

        $agenda = $this->actingAs($this->master, 'clinic')
            ->getJson('/api/clinic/appointments?' . http_build_query([
                'from' => $startsAt->copy()->subDay()->toDateString(),
                'to'   => $startsAt->copy()->addDay()->toDateString(),
            ]))
            ->assertOk()
            ->json('data');
        $this->assertSame('Fisio Que Saiu', collect($agenda)->firstWhere('id', $appointment->id)['clinic_user']['name'] ?? null);
    }

    public function test_delete_also_deactivates_and_drops_google_credentials(): void
    {
        $this->physio->forceFill([
            'google_access_token'  => 'token-de-acesso',
            'google_refresh_token' => 'token-de-refresh',
            'google_connected_at'  => now(),
        ])->save();

        $this->actingAs($this->master, 'clinic')
            ->deleteJson("/api/clinic/users/{$this->physio->id}")
            ->assertOk();

        // Desativado junto: nem um rollback do soft delete devolve o acesso.
        $row = ClinicUser::withTrashed()->findOrFail($this->physio->id);
        $this->assertSame(ClinicUser::STATUS_INACTIVE, $row->status);
        $this->assertNull($row->google_access_token);
        $this->assertNull($row->google_refresh_token);
        $this->assertNull($row->google_connected_at);
    }

    public function test_deleted_user_is_not_a_professional_anymore(): void
    {
        $this->actingAs($this->master, 'clinic')
            ->deleteJson("/api/clinic/users/{$this->physio->id}")
            ->assertOk();

        $ids = collect($this->actingAs($this->master, 'clinic')
            ->getJson('/api/clinic/users/professionals')
            ->assertOk()
            ->json('data'))->pluck('id');
        $this->assertNotContains($this->physio->id, $ids);
    }

    public function test_deleted_user_loses_access(): void
    {
        $token = auth('clinic')->login($this->physio);

        $this->actingAs($this->master, 'clinic')
            ->deleteJson("/api/clinic/users/{$this->physio->id}")
            ->assertOk();

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/clinic/auth/me')->assertUnauthorized();

        $this->app['auth']->forgetGuards();
        $this->withHeaders(['Authorization' => ''])
            ->postJson('/api/clinic/auth/login', ['email' => $this->physio->email, 'password' => 'password'])
            ->assertUnauthorized();
    }

    public function test_new_clinic_with_the_email_of_a_deleted_user_does_not_fail(): void
    {
        $this->actingAs($this->master, 'clinic')
            ->deleteJson("/api/clinic/users/{$this->physio->id}")
            ->assertOk();

        Clinic::factory()->create(['email' => $this->physio->email]);

        $this->assertSame(1, ClinicUser::withTrashed()->where('email', $this->physio->email)->count());
    }

    public function test_user_who_created_financial_entries_can_be_deleted(): void
    {
        $entry = FinancialTransaction::factory()->create([
            'clinic_id'          => $this->clinic->id,
            'created_by_user_id' => $this->physio->id,
        ]);

        $this->actingAs($this->master, 'clinic')
            ->deleteJson("/api/clinic/users/{$this->physio->id}")
            ->assertOk();

        $this->assertSoftDeleted('clinic_users', ['id' => $this->physio->id]);
        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $entry->id]);
    }
}
