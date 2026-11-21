<?php

namespace Modules\Patient\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Patient\Contracts\Public\PatientReminderPreferenceWriteServiceInterface;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientReminderPreferenceWriteServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_switches_off_the_reminder_of_a_patient_of_the_clinic(): void
    {
        $clinic  = Clinic::factory()->create();
        $patient = Patient::factory()->forClinic($clinic)->create(['receives_appointment_reminder_email' => true]);

        $result = app(PatientReminderPreferenceWriteServiceInterface::class)
            ->disableAppointmentReminderEmail($clinic->id, $patient->id);

        $this->assertTrue($result);
        $this->assertFalse((bool) $patient->fresh()->receives_appointment_reminder_email);
    }

    public function test_patient_of_another_clinic_or_deleted_is_not_changed(): void
    {
        $clinicA  = Clinic::factory()->create();
        $clinicB  = Clinic::factory()->create();
        $patientA = Patient::factory()->forClinic($clinicA)->create(['receives_appointment_reminder_email' => true]);
        $deleted  = Patient::factory()->forClinic($clinicB)->create(['receives_appointment_reminder_email' => true]);
        $deleted->delete();
        $service = app(PatientReminderPreferenceWriteServiceInterface::class);

        $this->assertFalse($service->disableAppointmentReminderEmail($clinicB->id, $patientA->id));
        $this->assertFalse($service->disableAppointmentReminderEmail($clinicB->id, $deleted->id));

        $this->assertTrue((bool) $patientA->fresh()->receives_appointment_reminder_email);
        $this->assertTrue((bool) Patient::withTrashed()->find($deleted->id)->receives_appointment_reminder_email);
    }
}
