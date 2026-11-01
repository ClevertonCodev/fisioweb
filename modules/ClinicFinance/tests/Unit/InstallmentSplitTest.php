<?php

namespace Modules\ClinicFinance\Tests\Unit;

use Modules\ClinicFinance\Support\InstallmentSplit;
use PHPUnit\Framework\TestCase;

class InstallmentSplitTest extends TestCase
{
    public function test_the_leftover_cent_of_amount_and_fee_goes_to_the_first(): void
    {
        $this->assertSame([
            ['gross' => '33.34', 'fee' => '1.34'],
            ['gross' => '33.33', 'fee' => '1.33'],
            ['gross' => '33.33', 'fee' => '1.33'],
        ], InstallmentSplit::of('100.00', '4.00', 3));
    }

    public function test_the_parts_add_up_to_the_total(): void
    {
        $parts = InstallmentSplit::of('3000.00', '89.90', 7);

        $this->assertSame(300000, (int) round(array_sum(array_column($parts, 'gross')) * 100));
        $this->assertSame(8990, (int) round(array_sum(array_column($parts, 'fee')) * 100));
    }

    public function test_fee_never_goes_above_the_amount_of_the_installment(): void
    {
        // R$ 3,00 com taxa R$ 2,99 em 3x: o 1º teria taxa R$ 1,01 sobre R$ 1,00.
        $this->assertSame([
            ['gross' => '1.00', 'fee' => '1.00'],
            ['gross' => '1.00', 'fee' => '1.00'],
            ['gross' => '1.00', 'fee' => '0.99'],
        ], InstallmentSplit::of('3.00', '2.99', 3));
    }
}
