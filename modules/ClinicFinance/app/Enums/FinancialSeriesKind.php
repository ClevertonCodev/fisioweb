<?php

namespace Modules\ClinicFinance\Enums;

enum FinancialSeriesKind: string
{
    case Installments = 'installments';
    case Recurrence   = 'recurrence';
}
