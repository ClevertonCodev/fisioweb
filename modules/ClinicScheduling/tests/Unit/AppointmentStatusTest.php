<?php

namespace Modules\ClinicScheduling\Tests\Unit;

use Carbon\Carbon;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Tests\TestCase;

class AppointmentStatusTest extends TestCase
{
    private Carbon $startsAt;

    protected function setUp(): void
    {
        parent::setUp();
        $this->startsAt = Carbon::parse('2026-06-20 10:00:00');
    }

    public function test_scheduled_can_go_to_confirmed_and_cancelled(): void
    {
        $before = $this->startsAt->copy()->subHour();

        $this->assertTrue(AppointmentStatus::Scheduled->canTransitionTo(AppointmentStatus::Confirmed, $this->startsAt, $before));
        $this->assertTrue(AppointmentStatus::Scheduled->canTransitionTo(AppointmentStatus::Cancelled, $this->startsAt, $before));
    }

    public function test_completed_and_no_show_require_appointment_to_have_started(): void
    {
        $before = $this->startsAt->copy()->subMinute();
        $after  = $this->startsAt->copy()->addMinute();

        $this->assertFalse(AppointmentStatus::Scheduled->canTransitionTo(AppointmentStatus::Completed, $this->startsAt, $before));
        $this->assertFalse(AppointmentStatus::Scheduled->canTransitionTo(AppointmentStatus::NoShow, $this->startsAt, $before));

        $this->assertTrue(AppointmentStatus::Scheduled->canTransitionTo(AppointmentStatus::Completed, $this->startsAt, $after));
        $this->assertTrue(AppointmentStatus::Confirmed->canTransitionTo(AppointmentStatus::NoShow, $this->startsAt, $after));
    }

    public function test_terminal_states_cannot_transition(): void
    {
        $after = $this->startsAt->copy()->addHour();

        $this->assertFalse(AppointmentStatus::Cancelled->canTransitionTo(AppointmentStatus::Scheduled, $this->startsAt, $after));
        $this->assertFalse(AppointmentStatus::Completed->canTransitionTo(AppointmentStatus::Confirmed, $this->startsAt, $after));
        $this->assertFalse(AppointmentStatus::NoShow->canTransitionTo(AppointmentStatus::Scheduled, $this->startsAt, $after));
    }

    public function test_cannot_transition_to_same_status(): void
    {
        $after = $this->startsAt->copy()->addHour();

        $this->assertFalse(AppointmentStatus::Scheduled->canTransitionTo(AppointmentStatus::Scheduled, $this->startsAt, $after));
    }

    public function test_label_and_color_match_frontend_tokens(): void
    {
        $this->assertSame('Agendada', AppointmentStatus::Scheduled->label());
        $this->assertSame('#3b82f6', AppointmentStatus::Scheduled->color());
        $this->assertSame('Cancelada', AppointmentStatus::Cancelled->label());
        $this->assertSame('#ef4444', AppointmentStatus::Cancelled->color());
    }
}
