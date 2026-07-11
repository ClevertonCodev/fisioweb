<?php

namespace Modules\GoogleCalendar\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Tests\TestCase;

class GoogleCalendarConnectionTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $user;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('googlecalendar.client_id', 'test-client-id');
        config()->set('googlecalendar.client_secret', 'test-secret');
        config()->set('googlecalendar.redirect', 'https://app.test/api/clinic/google-calendar/callback');

        $clinic     = Clinic::factory()->create();
        $this->user = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);
    }

    public function test_connect_returns_authorization_url(): void
    {
        $this->actingAs($this->user, 'clinic')
            ->getJson('/api/clinic/google-calendar/connect')
            ->assertOk()
            ->assertJsonStructure(['data' => ['authorization_url']]);
    }

    public function test_status_reflects_disconnected_by_default(): void
    {
        $this->actingAs($this->user, 'clinic')
            ->getJson('/api/clinic/google-calendar/status')
            ->assertOk()
            ->assertJsonPath('data.connected', false);
    }

    public function test_callback_persists_tokens_via_state(): void
    {
        $this->mock(GoogleCalendarServiceInterface::class, function ($mock) {
            $mock->shouldReceive('connectFromCallback')->once()
                ->with($this->user->id, 'fake-code');
        });

        $state = Crypt::encryptString((string) $this->user->id);

        $this->getJson('/api/clinic/google-calendar/callback?code=fake-code&state=' . urlencode($state))
            ->assertRedirect();
    }

    public function test_callback_with_error_does_not_connect(): void
    {
        $this->getJson('/api/clinic/google-calendar/callback?error=access_denied')
            ->assertRedirect();

        $this->assertFalse($this->user->fresh()->isGoogleConnected());
    }

    public function test_disconnect_clears_connection(): void
    {
        $this->user->forceFill([
            'google_access_token'  => 'token',
            'google_refresh_token' => 'refresh',
            'google_connected_at'  => now(),
            'google_calendar_id'   => 'primary',
        ])->save();

        $this->actingAs($this->user, 'clinic')
            ->deleteJson('/api/clinic/google-calendar')
            ->assertOk()
            ->assertJsonPath('data.connected', false);

        $fresh = $this->user->fresh();
        $this->assertFalse($fresh->isGoogleConnected());
        $this->assertNull($fresh->google_access_token);
        $this->assertNull($fresh->google_refresh_token);
    }
}
