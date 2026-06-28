<?php

namespace Modules\ClinicFinance\Enums;

enum FinancialCategoryOrigin: string
{
    case System = 'system';
    case Custom = 'custom';
}
