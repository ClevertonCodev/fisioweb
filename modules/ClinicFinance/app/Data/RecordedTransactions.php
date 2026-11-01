<?php

namespace Modules\ClinicFinance\Data;

use Modules\ClinicFinance\Models\FinancialTransaction;

/** O que o `POST transactions` devolve: o 1º lançamento criado e quantos foram criados. */
final readonly class RecordedTransactions
{
    public function __construct(
        public FinancialTransaction $first,
        public int $count,
    ) {}
}
