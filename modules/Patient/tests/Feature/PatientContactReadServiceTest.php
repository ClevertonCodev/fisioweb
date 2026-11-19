<?php

namespace Modules\Patient\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Patient\Contracts\Public\PatientContactReadServiceInterface;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientContactReadServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_contact_for_patient_of_own_clinic_with_apelido_and_reminder_flag(): void
    {
        $clinic  = Clinic::factory()->create();
        $patient = Patient::factory()->create([
            'clinic_id'                           => $clinic->id,
            'name'                                => 'Ana Paula Silva',
            'apelido'                             => 'Aninha',
            'use_apelido'                         => true,
            'email'                               => 'ana@example.test',
            'phone'                               => '(11) 98888-7777',
            'receives_appointment_reminder_email' => false,
        ]);

        $service = app(PatientContactReadServiceInterface::class);
        $contact = $service->findById($clinic->id, $patient->id);

        $this->assertNotNull($contact);
        $this->assertSame($patient->id, $contact->id);
        $this->assertSame($clinic->id, $contact->clinicId);
        $this->assertSame('Ana Paula Silva', $contact->name);
        $this->assertSame('Aninha', $contact->apelido);
        $this->assertTrue($contact->useApelido);
        $this->assertSame('Aninha', $contact->greetingName());
        $this->assertSame('ana@example.test', $contact->email);
        $this->assertSame('(11) 98888-7777', $contact->phone);
        $this->assertFalse($contact->receivesAppointmentReminderEmail);
    }

    public function test_greeting_name_uses_first_name_when_use_apelido_is_false_or_apelido_is_empty(): void
    {
        $clinic   = Clinic::factory()->create();
        $patientA = Patient::factory()->create([
            'clinic_id'   => $clinic->id,
            'name'        => 'Carlos Eduardo Souza',
            'apelido'     => 'Cadu',
            'use_apelido' => false,
        ]);
        $patientB = Patient::factory()->create([
            'clinic_id'   => $clinic->id,
            'name'        => 'Maria Clara',
            'apelido'     => '   ',
            'use_apelido' => true,
        ]);

        $service = app(PatientContactReadServiceInterface::class);

        $this->assertSame('Carlos', $service->findById($clinic->id, $patientA->id)?->greetingName());
        $this->assertSame('Maria', $service->findById($clinic->id, $patientB->id)?->greetingName());
    }

    public function test_returns_null_for_patient_of_another_clinic_or_deleted_patient(): void
    {
        $clinicA  = Clinic::factory()->create();
        $clinicB  = Clinic::factory()->create();
        $patientA = Patient::factory()->create(['clinic_id' => $clinicA->id]);
        $deleted  = Patient::factory()->create(['clinic_id' => $clinicA->id]);
        $deleted->delete();

        $service = app(PatientContactReadServiceInterface::class);

        $this->assertNull($service->findById($clinicB->id, $patientA->id));
        $this->assertNull($service->findById($clinicA->id, $deleted->id));
    }
}
