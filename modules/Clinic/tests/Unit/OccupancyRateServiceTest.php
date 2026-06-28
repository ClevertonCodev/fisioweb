<?php

namespace Modules\Clinic\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Services\OccupancyRateService;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class OccupancyRateServiceTest extends TestCase
{
    use RefreshDatabase;

    private OccupancyRateService $service;

    private Clinic $clinic;

    private ClinicUser $physio;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(OccupancyRateService::class);
        // Janela padrão (08:00–18:00 = 600 min/dia, seg–sex) e timezone UTC.
        $this->clinic  = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->physio  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
    }

    private function firstMondayOfMonth(): Carbon
    {
        $day = Carbon::now('UTC')->startOfMonth();
        while ($day->isoWeekday() !== Carbon::MONDAY) {
            $day->addDay();
        }

        return $day;
    }

    private function appointment(Carbon $start, int $minutes): void
    {
        Appointment::factory()->create([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->physio->id,
            'patient_id'     => Patient::factory()->create(['clinic_id' => $this->clinic->id])->id,
            'starts_at'      => $start,
            'ends_at'        => $start->copy()->addMinutes($minutes),
        ]);
    }

    public function test_daily_rate_is_occupied_over_window(): void
    {
        $monday = $this->firstMondayOfMonth();
        // 5h de consulta numa janela de 10h → 50% naquele dia.
        $this->appointment($monday->copy()->setTime(9, 0), 300);

        $result = $this->service->compute($this->clinic, $this->physio->id, 'daily');

        $this->assertCount(Carbon::now('UTC')->daysInMonth, $result['buckets']);
        $this->assertSame(0.5, $result['buckets'][$monday->day - 1]['rate']);
    }

    public function test_cancelled_appointments_do_not_count(): void
    {
        $monday = $this->firstMondayOfMonth();
        Appointment::factory()->create([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->physio->id,
            'patient_id'     => Patient::factory()->create(['clinic_id' => $this->clinic->id])->id,
            'starts_at'      => $monday->copy()->setTime(9, 0),
            'ends_at'        => $monday->copy()->setTime(14, 0),
            'status'         => \Modules\ClinicScheduling\Enums\AppointmentStatus::Cancelled,
        ]);

        $result = $this->service->compute($this->clinic, $this->physio->id, 'daily');

        $this->assertSame(0.0, $result['buckets'][$monday->day - 1]['rate']);
    }

    public function test_weekly_has_twelve_buckets(): void
    {
        $result = $this->service->compute($this->clinic, $this->physio->id, 'weekly');

        $this->assertCount(12, $result['buckets']);
    }

    public function test_monthly_has_twelve_buckets(): void
    {
        $result = $this->service->compute($this->clinic, $this->physio->id, 'monthly');

        $this->assertCount(12, $result['buckets']);
    }

    public function test_empty_agenda_yields_zero_rate(): void
    {
        $result = $this->service->compute($this->clinic, $this->physio->id, 'daily');

        $this->assertSame(0.0, $result['occupied_rate']);
    }
}
