<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Contracts\Public\ClinicContactReadServiceInterface;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class ClinicContactReadServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_clinic_contact_with_address_timezone_and_reminder_flag(): void
    {
        $clinic = Clinic::factory()->create([
            'name'                               => 'Clínica Movimento',
            'phone'                              => '(11) 4000-1234',
            'address'                            => 'Rua das Flores',
            'number'                             => '120',
            'city'                               => 'São Paulo',
            'state'                              => 'SP',
            'timezone'                           => 'America/Manaus',
            'appointment_reminder_email_enabled' => true,
        ]);

        $service = app(ClinicContactReadServiceInterface::class);
        $contact = $service->findClinic($clinic->id);

        $this->assertNotNull($contact);
        $this->assertSame($clinic->id, $contact->id);
        $this->assertSame('Clínica Movimento', $contact->name);
        $this->assertSame('(11) 4000-1234', $contact->phone);
        $this->assertSame('Rua das Flores', $contact->address);
        $this->assertSame('120', $contact->number);
        $this->assertSame('São Paulo', $contact->city);
        $this->assertSame('SP', $contact->state);
        $this->assertSame('America/Manaus', $contact->timezone);
        $this->assertTrue($contact->appointmentReminderEmailEnabled);
        $this->assertSame('Rua das Flores, 120 · São Paulo/SP', $contact->formattedAddress());
    }

    public function test_returns_null_for_missing_or_deleted_clinic(): void
    {
        $deleted = Clinic::factory()->create();
        $deleted->delete();

        $service = app(ClinicContactReadServiceInterface::class);

        $this->assertNull($service->findClinic(999999));
        $this->assertNull($service->findClinic($deleted->id));
    }

    public function test_returns_professional_of_own_clinic_and_null_for_another_clinic(): void
    {
        $clinicA = Clinic::factory()->create();
        $clinicB = Clinic::factory()->create();
        $physioA = ClinicUser::factory()->create([
            'clinic_id' => $clinicA->id,
            'name'      => 'Rafael Lima',
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);

        $service = app(ClinicContactReadServiceInterface::class);

        $found = $service->findProfessional($clinicA->id, $physioA->id);
        $this->assertNotNull($found);
        $this->assertSame($physioA->id, $found->id);
        $this->assertSame($clinicA->id, $found->clinicId);
        $this->assertSame('Rafael Lima', $found->name);
        $this->assertSame(ClinicUser::ROLE_PHYSIOTHERAPIST, $found->role);
        $this->assertSame('Fisioterapeuta', $found->roleLabel);

        $this->assertNull($service->findProfessional($clinicB->id, $physioA->id));
    }
}
