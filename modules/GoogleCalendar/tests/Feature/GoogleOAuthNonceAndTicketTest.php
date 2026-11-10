<?php

namespace Modules\GoogleCalendar\Tests\Feature;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Testing\TestResponse;
use Modules\Clinic\Data\Public\GoogleTokenSetDTO;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Modules\GoogleCalendar\Services\GoogleCalendarService;
use Tests\TestCase;

class GoogleOAuthNonceAndTicketTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $userA;

    private ClinicUser $colleagueOfA;

    private ClinicUser $userOfOtherClinic;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('googlecalendar.client_id', 'test-client-id');
        config()->set('googlecalendar.client_secret', 'test-secret');
        config()->set('googlecalendar.redirect', 'https://app.test/api/clinic/google-calendar/callback');

        $clinicA                 = Clinic::factory()->create();
        $this->userA             = ClinicUser::factory()->create(['clinic_id' => $clinicA->id]);
        $this->colleagueOfA      = ClinicUser::factory()->create(['clinic_id' => $clinicA->id]);
        $this->userOfOtherClinic = ClinicUser::factory()->create(['clinic_id' => Clinic::factory()->create()->id]);

        $this->app->bind(GoogleCalendarServiceInterface::class, FakeGoogleTokenExchange::class);
    }

    public function test_callback_without_jwt_stores_tokens_for_nobody(): void
    {
        $state = $this->stateFor($this->userA, '/clinica/agenda');

        $this->returnFromGoogle($state, 'code-of-victim')
            ->assertRedirectContains('/clinica/agenda?google_ticket=');

        $this->assertNobodyConnected();
    }

    public function test_full_flow_connects_the_user_who_started_it(): void
    {
        $ticket = $this->ticketFrom($this->returnFromGoogle($this->stateFor($this->userA), 'code-of-a'));

        $this->actingAs($this->userA, 'clinic')
            ->postJson('/api/clinic/google-calendar/complete', ['ticket' => $ticket])
            ->assertOk()
            ->assertExactJson(['data' => ['connected' => true]]);

        $this->assertSame('access-from-code-of-a', $this->userA->fresh()->google_access_token);
        $this->assertFalse($this->colleagueOfA->fresh()->isGoogleConnected());

        $this->actingAs($this->userA->fresh(), 'clinic')
            ->getJson('/api/clinic/google-calendar/status')
            ->assertOk()
            ->assertJsonPath('data.connected', true);
    }

    public function test_ticket_of_one_user_with_jwt_of_another_clinic_is_forbidden_and_stores_nothing(): void
    {
        $ticket = $this->ticketFrom($this->returnFromGoogle($this->stateFor($this->userA), 'code-of-victim'));

        $this->actingAs($this->userOfOtherClinic, 'clinic')
            ->postJson('/api/clinic/google-calendar/complete', ['ticket' => $ticket])
            ->assertForbidden();

        $this->assertNobodyConnected();
    }

    public function test_ticket_of_a_colleague_of_the_same_clinic_is_forbidden(): void
    {
        $ticket = $this->ticketFrom($this->returnFromGoogle($this->stateFor($this->userA), 'code-of-victim'));

        $this->actingAs($this->colleagueOfA, 'clinic')
            ->postJson('/api/clinic/google-calendar/complete', ['ticket' => $ticket])
            ->assertForbidden();

        $this->assertNobodyConnected();
    }

    public function test_reused_ticket_is_rejected_and_keeps_the_first_connection(): void
    {
        $ticket = $this->ticketFrom($this->returnFromGoogle($this->stateFor($this->userA), 'first-code'));

        $this->actingAs($this->userA, 'clinic')
            ->postJson('/api/clinic/google-calendar/complete', ['ticket' => $ticket])
            ->assertOk();

        $this->actingAs($this->userA, 'clinic')
            ->postJson('/api/clinic/google-calendar/complete', ['ticket' => $ticket])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ticket');

        $this->assertSame('access-from-first-code', $this->userA->fresh()->google_access_token);
    }

    public function test_ticket_tried_by_another_user_is_burned(): void
    {
        $ticket = $this->ticketFrom($this->returnFromGoogle($this->stateFor($this->userA), 'code-of-a'));

        $this->actingAs($this->userOfOtherClinic, 'clinic')
            ->postJson('/api/clinic/google-calendar/complete', ['ticket' => $ticket])
            ->assertForbidden();

        $this->actingAs($this->userA, 'clinic')
            ->postJson('/api/clinic/google-calendar/complete', ['ticket' => $ticket])
            ->assertUnprocessable();

        $this->assertNobodyConnected();
    }

    public function test_ticket_expires_after_five_minutes(): void
    {
        $ticket = $this->ticketFrom($this->returnFromGoogle($this->stateFor($this->userA), 'code-of-a'));

        $this->travel(5)->minutes();
        $this->travel(1)->seconds();

        $this->actingAs($this->userA, 'clinic')
            ->postJson('/api/clinic/google-calendar/complete', ['ticket' => $ticket])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ticket');

        $this->assertNobodyConnected();
    }

    public function test_ticket_still_works_just_before_five_minutes(): void
    {
        $ticket = $this->ticketFrom($this->returnFromGoogle($this->stateFor($this->userA), 'code-of-a'));

        $this->travel(4)->minutes();
        $this->travel(59)->seconds();

        $this->actingAs($this->userA, 'clinic')
            ->postJson('/api/clinic/google-calendar/complete', ['ticket' => $ticket])
            ->assertOk();
    }

    public function test_complete_rejects_missing_malformed_and_unknown_tickets(): void
    {
        foreach ([[], ['ticket' => ''], ['ticket' => ['x']], ['ticket' => str_repeat('a', 129)], ['ticket' => bin2hex(random_bytes(32))]] as $payload) {
            $this->actingAs($this->userA, 'clinic')
                ->postJson('/api/clinic/google-calendar/complete', $payload)
                ->assertUnprocessable()
                ->assertJsonValidationErrors('ticket');
        }

        $this->assertNobodyConnected();
    }

    public function test_complete_requires_authentication(): void
    {
        $ticket = $this->ticketFrom($this->returnFromGoogle($this->stateFor($this->userA), 'code-of-a'));

        $this->postJson('/api/clinic/google-calendar/complete', ['ticket' => $ticket])
            ->assertUnauthorized();

        $this->assertNobodyConnected();
    }

    public function test_reused_state_redirects_with_error_and_issues_no_second_ticket(): void
    {
        $state = $this->stateFor($this->userA);

        $this->ticketFrom($this->returnFromGoogle($state, 'first-code'));

        $this->returnFromGoogle($state, 'second-code')
            ->assertRedirect('/clinica/agenda?google=error');
    }

    public function test_state_expires_after_ten_minutes(): void
    {
        $state = $this->stateFor($this->userA);

        $this->travel(10)->minutes();
        $this->travel(1)->seconds();

        $this->returnFromGoogle($state)
            ->assertRedirect('/clinica/agenda?google=error');
    }

    public function test_state_still_works_just_before_ten_minutes(): void
    {
        $state = $this->stateFor($this->userA);

        $this->travel(9)->minutes();
        $this->travel(59)->seconds();

        $this->ticketFrom($this->returnFromGoogle($state));
    }

    public function test_legacy_encrypted_state_is_rejected_and_stores_nothing(): void
    {
        foreach ([
            Crypt::encryptString((string) $this->userA->id),
            Crypt::encryptString(json_encode(['uid' => $this->userA->id, 'return' => '/clinica/agenda'])),
        ] as $legacyState) {
            $this->returnFromGoogle($legacyState, 'code-of-victim')
                ->assertRedirect('/clinica/agenda?google=error');
        }

        $this->assertNobodyConnected();
    }

    public function test_consent_denied_by_google_redirects_with_error_to_the_origin_and_burns_the_state(): void
    {
        $state = $this->stateFor($this->userA, "/clinica/usuarios/{$this->userA->id}/editar");

        $this->get('/api/clinic/google-calendar/callback?' . http_build_query(['state' => $state, 'error' => 'access_denied', 'code' => 'code']))
            ->assertRedirect("/clinica/usuarios/{$this->userA->id}/editar?google=error");

        $this->returnFromGoogle($state)
            ->assertRedirect('/clinica/agenda?google=error');
    }

    public function test_callback_with_malformed_parameters_redirects_with_error(): void
    {
        $state = $this->stateFor($this->userA);

        foreach ([
            '',
            'error=access_denied',
            'code=abc',
            'state[]=x&code=abc',
            'state=' . urlencode($state) . '&code[]=abc',
        ] as $query) {
            $this->get('/api/clinic/google-calendar/callback?' . $query)
                ->assertRedirect('/clinica/agenda?google=error');
        }

        $this->assertNobodyConnected();
    }

    public function test_google_rejecting_the_code_gives_422_and_does_not_connect(): void
    {
        $ticket = $this->ticketFrom($this->returnFromGoogle(
            $this->stateFor($this->userA),
            FakeGoogleTokenExchange::REJECTED_CODE,
        ));

        $this->actingAs($this->userA, 'clinic')
            ->postJson('/api/clinic/google-calendar/complete', ['ticket' => $ticket])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ticket');

        $this->assertNobodyConnected();
    }

    public function test_callback_returns_to_the_screen_that_started_the_flow(): void
    {
        $ownProfile = "/clinica/usuarios/{$this->userA->id}/editar";

        foreach ([
            '/clinica/agenda'  => '/clinica/agenda',
            $ownProfile        => $ownProfile,
            $ownProfile . '/'  => $ownProfile,
            '/clinica/agenda/' => '/clinica/agenda',
        ] as $returnTo => $expected) {
            $this->returnFromGoogle($this->stateFor($this->userA, $returnTo))
                ->assertRedirectContains($expected . '?google_ticket=');
        }
    }

    public function test_callback_only_returns_to_screens_that_complete_the_connection(): void
    {
        foreach ([
            '/clinica/usuarios',
            '/clinic/usuarios',
            "/clinica/usuarios/{$this->colleagueOfA->id}/editar",
            '/clinica/usuarios/abc/editar',
            "/clinica/usuarios/{$this->userA->id}/editar/extra",
            'https://evil.test/clinica/agenda',
            '//evil.test/clinica/agenda',
            null,
        ] as $returnTo) {
            $location = (string) $this->returnFromGoogle($this->stateFor($this->userA, $returnTo))->headers->get('Location');

            $this->assertSame(
                url('/clinica/agenda'),
                strtok($location, '?'),
                'return_to ' . var_export($returnTo, true),
            );
        }
    }

    private function ticketFrom(TestResponse $callback): string
    {
        $location = (string) $callback->headers->get('Location');
        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

        $this->assertArrayHasKey('google_ticket', $query, "Sem ticket em {$location}");

        return $query['google_ticket'];
    }

    private function stateFor(ClinicUser $user, ?string $returnTo = null): string
    {
        $url = $this->actingAs($user, 'clinic')
            ->getJson('/api/clinic/google-calendar/connect' . ($returnTo ? '?return_to=' . urlencode($returnTo) : ''))
            ->assertOk()
            ->json('data.authorization_url');

        $this->app['auth']->forgetGuards();

        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        return $query['state'];
    }

    private function returnFromGoogle(string $state, string $code = 'code'): TestResponse
    {
        return $this->get('/api/clinic/google-calendar/callback?' . http_build_query([
            'state' => $state,
            'code'  => $code,
        ]));
    }

    private function assertNobodyConnected(): void
    {
        foreach ([$this->userA, $this->colleagueOfA, $this->userOfOtherClinic] as $user) {
            $this->assertFalse($user->fresh()->isGoogleConnected(), "Usuário {$user->id} não devia estar conectado.");
            $this->assertNull($user->fresh()->google_access_token);
        }
    }
}

class FakeGoogleTokenExchange extends GoogleCalendarService
{
    public const REJECTED_CODE = 'code-rejected-by-google';

    public function connectFromCallback(int $clinicUserId, string $code): void
    {
        if ($code === self::REJECTED_CODE) {
            throw new \RuntimeException('invalid_grant');
        }

        $this->connections->storeTokens($clinicUserId, new GoogleTokenSetDTO(
            accessToken: 'access-from-' . $code,
            refreshToken: 'refresh-from-' . $code,
            expiresAt: CarbonImmutable::now()->addHour(),
            calendarId: 'primary',
            syncToken: null,
            connectedAt: CarbonImmutable::now(),
        ));
    }
}
