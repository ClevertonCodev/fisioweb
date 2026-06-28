<?php

namespace Modules\ClinicFinance\Contracts;

use Symfony\Component\HttpFoundation\Response;

interface FinanceExportServiceInterface
{
    /**
     * @param  array<string, mixed>  $validated
     */
    public function export(int $clinicId, array $validated): Response;
}
