<?php

namespace Modules\ClinicFinance\Tests\Unit\Events;

use Carbon\CarbonImmutable;
use Modules\ClinicFinance\Events\FinancialTransactionDeleted;
use Modules\ClinicFinance\Events\FinancialTransactionRecorded;
use Modules\ClinicFinance\Events\FinancialTransactionUpdated;
use PHPUnit\Framework\TestCase;

class FinancialTransactionEventsTest extends TestCase
{
    public function test_transaction_events_expose_versioned_minimal_payloads(): void
    {
        $occurredAt = CarbonImmutable::now();

        $recorded = new FinancialTransactionRecorded(1, 10, 20, 30, 'entrada', 'recebido', '150.00', '2026-06-27', 40, $occurredAt);
        $updated  = new FinancialTransactionUpdated(1, 10, 20, 30, ['status'], 'recebido', '150.00', '2026-06-27', $occurredAt);
        $deleted  = new FinancialTransactionDeleted(1, 10, 20, 30, $occurredAt);

        $this->assertSame(1, $recorded->version);
        $this->assertSame(10, $updated->transactionId);
        $this->assertSame(20, $deleted->clinicId);
        $this->assertSame($occurredAt, $recorded->occurredAt);
    }
}
