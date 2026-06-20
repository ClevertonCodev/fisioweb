<?php

namespace Modules\Clinic\Enums;

enum FinancialCategoryOrigin: string
{
    case System = 'system';
    case Custom = 'custom';
}
