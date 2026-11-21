<?php

namespace Modules\Email\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Email\Support\ReminderUnsubscribeLink;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class ReminderUnsubscribeTest extends TestCase
{
    use RefreshDatabase;

    private const URL = '/api/email/reminders/unsubscribe';

    private Clinic $clinic;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic  = Clinic::factory()->create();
        $this->patient = Patient::factory()->forClinic($this->clinic)->create([
            'receives_appointment_reminder_email' => true,
        ]);
    }

    public function test_valid_token_switches_off_the_reminder_of_the_right_patient_and_repeating_still_responds_200(): void
    {
        $other = Patient::factory()->forClinic($this->clinic)->create(['receives_appointment_reminder_email' => true]);
        $token = ReminderUnsubscribeLink::token($this->clinic->id, $this->patient->id);

        $this->postJson(self::URL, ['token' => $token])
            ->assertOk()
            ->assertExactJson(['data' => ['unsubscribed' => true]]);

        $this->assertFalse((bool) $this->patient->fresh()->receives_appointment_reminder_email);
        $this->assertTrue((bool) $other->fresh()->receives_appointment_reminder_email);

        $this->postJson(self::URL, ['token' => $token])->assertOk();
        $this->assertFalse((bool) $this->patient->fresh()->receives_appointment_reminder_email);
    }

    /**
     * @return list<bool>
     */
    private function reminderFlags(): array
    {
        return Patient::query()->orderBy('id')->pluck('receives_appointment_reminder_email')->map(fn ($v) => (bool) $v)->all();
    }

    public function test_tampered_token_responds_404_and_changes_no_patient(): void
    {
        $token   = ReminderUnsubscribeLink::token($this->clinic->id, $this->patient->id);
        $last    = substr($token, -1);
        $flipped = substr($token, 0, -1) . ($last === 'a' ? 'b' : 'a');
        $before  = $this->reminderFlags();

        foreach ([$flipped, 'abc', "{$this->clinic->id}.{$this->patient->id}", strtoupper($token)] as $bad) {
            $this->postJson(self::URL, ['token' => $bad])->assertNotFound();
        }

        $this->assertSame($before, $this->reminderFlags());
    }

    public function test_token_switched_to_another_patient_responds_404_and_changes_no_patient(): void
    {
        $other     = Patient::factory()->forClinic($this->clinic)->create(['receives_appointment_reminder_email' => true]);
        $signature = explode('.', ReminderUnsubscribeLink::token($this->clinic->id, $this->patient->id))[2];
        $before    = $this->reminderFlags();

        $this->postJson(self::URL, ['token' => "{$this->clinic->id}.{$other->id}.{$signature}"])->assertNotFound();

        $this->assertSame($before, $this->reminderFlags());
    }

    public function test_signed_token_for_another_clinic_does_not_switch_off_a_patient_of_this_clinic(): void
    {
        $clinicB  = Clinic::factory()->create();
        $patientB = Patient::factory()->forClinic($clinicB)->create(['receives_appointment_reminder_email' => true]);
        $before   = $this->reminderFlags();

        $this->postJson(self::URL, ['token' => ReminderUnsubscribeLink::token($clinicB->id, $this->patient->id)])->assertNotFound();

        $signatureForA = explode('.', ReminderUnsubscribeLink::token($this->clinic->id, $this->patient->id))[2];
        $this->postJson(self::URL, ['token' => "{$clinicB->id}.{$this->patient->id}.{$signatureForA}"])->assertNotFound();

        $this->assertSame($before, $this->reminderFlags());
        $this->assertTrue((bool) $patientB->fresh()->receives_appointment_reminder_email);
    }

    public function test_missing_token_responds_422(): void
    {
        $this->postJson(self::URL, [])->assertUnprocessable()->assertJsonValidationErrors('token');
        $this->postJson(self::URL, ['token' => ['x']])->assertUnprocessable()->assertJsonValidationErrors('token');
    }

    public function test_more_than_ten_attempts_a_minute_from_the_same_ip_respond_429(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson(self::URL, ['token' => 'abc'])->assertNotFound();
        }

        $this->postJson(self::URL, ['token' => ReminderUnsubscribeLink::token($this->clinic->id, $this->patient->id)])
            ->assertTooManyRequests();
        $this->assertTrue((bool) $this->patient->fresh()->receives_appointment_reminder_email);

        $this->travel(61)->seconds();
        $this->postJson(self::URL, ['token' => ReminderUnsubscribeLink::token($this->clinic->id, $this->patient->id)])->assertOk();
    }
}
