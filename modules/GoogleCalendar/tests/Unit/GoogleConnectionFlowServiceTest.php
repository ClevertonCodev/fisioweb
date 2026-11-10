<?php

namespace Modules\GoogleCalendar\Tests\Unit;

use Illuminate\Cache\ArrayStore;
use Illuminate\Cache\Repository;
use Illuminate\Validation\ValidationException;
use Mockery;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Modules\GoogleCalendar\Services\GoogleConnectionFlowService;
use Tests\TestCase;

class GoogleConnectionFlowServiceTest extends TestCase
{
    private ConcurrentArrayStore $store;

    private GoogleConnectionFlowService $flow;

    private ?string $sentState = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = new ConcurrentArrayStore;

        $google = Mockery::mock(GoogleCalendarServiceInterface::class);
        $google->shouldReceive('getAuthUrl')->andReturnUsing(function (string $state) {
            $this->sentState = $state;

            return 'https://accounts.google.test/auth?state=' . $state;
        });

        $this->flow = new GoogleConnectionFlowService(new Repository($this->store), $google);
    }

    public function test_cache_never_holds_the_state_the_ticket_or_the_code_in_clear(): void
    {
        $this->flow->authorizationUrl(7, '/clinica/agenda');
        $redirect = $this->flow->redirectAfterConsent($this->sentState, 'secret-google-code', false);
        parse_str((string) parse_url($redirect, PHP_URL_QUERY), $query);

        $dump = serialize($this->store->dump());

        $this->assertNotEmpty($query['google_ticket']);
        $this->assertStringNotContainsString($this->sentState, $dump);
        $this->assertStringNotContainsString($query['google_ticket'], $dump);
        $this->assertStringNotContainsString('secret-google-code', $dump);
    }

    public function test_invented_state_or_ticket_writes_nothing_to_the_cache(): void
    {
        $this->assertSame(
            '/clinica/agenda?google=error',
            $this->flow->redirectAfterConsent(bin2hex(random_bytes(32)), 'code', false),
        );

        try {
            $this->flow->complete(7, bin2hex(random_bytes(32)));
            $this->fail('Ticket inventado devia ser recusado.');
        } catch (ValidationException) {
        }

        $this->assertSame([], $this->store->dump());
    }

    public function test_two_simultaneous_callbacks_with_the_same_state_issue_one_ticket(): void
    {
        $this->flow->authorizationUrl(7, '/clinica/agenda');
        $concurrent = null;

        $this->store->beforeNextDelete(function () use (&$concurrent) {
            $concurrent = $this->flow->redirectAfterConsent($this->sentState, 'code', false);
        });

        $first = $this->flow->redirectAfterConsent($this->sentState, 'code', false);

        $outcomes = [$first, $concurrent];
        sort($outcomes);

        $this->assertSame('/clinica/agenda?google=error', $outcomes[0]);
        $this->assertStringStartsWith('/clinica/agenda?google_ticket=', $outcomes[1]);
    }

    public function test_two_simultaneous_completes_with_the_same_ticket_exchange_the_code_once(): void
    {
        $google = Mockery::mock(GoogleCalendarServiceInterface::class);
        $google->shouldReceive('getAuthUrl')->andReturnUsing(fn (string $state) => $this->sentState = $state);
        $google->shouldReceive('connectFromCallback')->once()->with(7, 'code');
        $flow = new GoogleConnectionFlowService(new Repository($this->store), $google);

        $flow->authorizationUrl(7, '/clinica/agenda');
        parse_str((string) parse_url($flow->redirectAfterConsent($this->sentState, 'code', false), PHP_URL_QUERY), $query);
        $rejected = 0;
        $attempt  = function () use ($flow, $query, &$rejected) {
            try {
                $flow->complete(7, $query['google_ticket']);
            } catch (ValidationException) {
                $rejected++;
            }
        };

        $this->store->beforeNextDelete($attempt);
        $attempt();

        $this->assertSame(1, $rejected);
    }
}

class ConcurrentArrayStore extends ArrayStore
{
    /** @var (callable(): void)|null */
    private $beforeDelete = null;

    public function beforeNextDelete(callable $callback): void
    {
        $this->beforeDelete = $callback;
    }

    public function forget($key)
    {
        if (!is_null($this->beforeDelete)) {
            $callback           = $this->beforeDelete;
            $this->beforeDelete = null;
            $callback();
        }

        return parent::forget($key);
    }

    public function add($key, $value, $seconds): bool
    {
        if (!is_null(parent::get($key))) {
            return false;
        }

        return $this->put($key, $value, $seconds);
    }

    /**
     * @return array<string, array{value: mixed, expiresAt: float|int}>
     */
    public function dump(): array
    {
        return $this->storage;
    }
}
