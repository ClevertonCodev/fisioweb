<?php

namespace Modules\GoogleCalendar\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Tests\TestCase;

class GoogleCalendarIsolationTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $userA;

    private ClinicUser $userB;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('googlecalendar.client_id', 'test-client-id');
        config()->set('googlecalendar.client_secret', 'test-secret');
        config()->set('googlecalendar.redirect', 'https://app.test/api/clinic/google-calendar/callback');

        $this->userA = ClinicUser::factory()->create([
            'clinic_id' => Clinic::factory()->create()->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);
        $this->userA->forceFill([
            'google_access_token'  => 'token-a',
            'google_refresh_token' => 'refresh-a',
            'google_connected_at'  => now(),
            'google_calendar_id'   => 'primary',
        ])->save();

        $this->userB = ClinicUser::factory()->create([
            'clinic_id' => Clinic::factory()->create()->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);
    }

    public function test_connect_state_is_an_opaque_nonce_that_changes_on_every_request(): void
    {
        $states = [];

        foreach ([$this->userB, $this->userB] as $user) {
            $url = $this->actingAs($user, 'clinic')
                ->getJson('/api/clinic/google-calendar/connect')
                ->assertOk()
                ->json('data.authorization_url');

            parse_str((string) parse_url($url, PHP_URL_QUERY), $query);
            $states[] = $query['state'];
        }

        $this->assertNotSame($states[0], $states[1]);

        foreach ($states as $state) {
            $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $state);
        }
    }

    public function test_status_of_another_clinic_user_does_not_reflect_this_connection(): void
    {
        $this->actingAs($this->userB, 'clinic')
            ->getJson('/api/clinic/google-calendar/status')
            ->assertOk()
            ->assertJsonPath('data.connected', false);
    }

    public function test_pull_of_another_clinic_user_does_not_sync_this_account(): void
    {
        $this->mock(GoogleCalendarServiceInterface::class, function ($mock) {
            $mock->shouldReceive('pullChanges')->never();
        });

        $this->actingAs($this->userB, 'clinic')
            ->postJson('/api/clinic/google-calendar/pull')
            ->assertStatus(422);
    }

    public function test_disconnect_of_another_clinic_user_keeps_this_connection(): void
    {
        $this->actingAs($this->userB, 'clinic')
            ->deleteJson('/api/clinic/google-calendar')
            ->assertOk();

        $fresh = $this->userA->fresh();
        $this->assertTrue($fresh->isGoogleConnected());
        $this->assertSame('token-a', $fresh->google_access_token);
    }
}
