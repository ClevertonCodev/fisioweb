<?php

namespace Modules\Email\Tests\Unit;

use Modules\Email\Support\ClinicDateFormatter;
use Tests\TestCase;

class ClinicDateFormatterTest extends TestCase
{
    public function test_formats_calendar_date_in_clinic_timezone_without_shifting_day(): void
    {
        $date = now()->addDays(5);

        $this->assertSame(
            $date->format('d/m/Y'),
            ClinicDateFormatter::formatCalendarDate($date->toDateString(), 'America/Sao_Paulo'),
        );
    }

    public function test_falls_back_to_default_timezone_when_timezone_is_invalid(): void
    {
        $date = now()->addDays(2);

        $this->assertSame(
            $date->format('d/m/Y'),
            ClinicDateFormatter::formatCalendarDate($date->toDateString(), 'Invalid/Zone'),
        );
    }

    public function test_returns_null_for_empty_or_malformed_date(): void
    {
        $this->assertNull(ClinicDateFormatter::formatCalendarDate(null, 'America/Sao_Paulo'));
        $this->assertNull(ClinicDateFormatter::formatCalendarDate('', 'America/Sao_Paulo'));
        $this->assertNull(ClinicDateFormatter::formatCalendarDate('not-a-date', 'America/Sao_Paulo'));
    }
}
