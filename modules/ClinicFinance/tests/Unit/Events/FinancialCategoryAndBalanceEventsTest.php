<?php

namespace Modules\ClinicFinance\Tests\Unit\Events;

use Carbon\CarbonImmutable;
use Modules\ClinicFinance\Events\FinancialCategoryCreated;
use Modules\ClinicFinance\Events\OpeningBalanceUpdated;
use PHPUnit\Framework\TestCase;

class FinancialCategoryAndBalanceEventsTest extends TestCase
{
    public function test_category_and_opening_balance_events_expose_versioned_minimal_payloads(): void
    {
        $occurredAt = CarbonImmutable::now();

        $category = new FinancialCategoryCreated(1, 10, 20, 30, 'Pilates', 'entrada', $occurredAt);
        $balance  = new OpeningBalanceUpdated(1, 11, 20, 30, 2026, 6, '1000.00', $occurredAt);

        $this->assertSame(1, $category->version);
        $this->assertSame('Pilates', $category->name);
        $this->assertSame(2026, $balance->year);
        $this->assertSame($occurredAt, $balance->occurredAt);
    }
}
