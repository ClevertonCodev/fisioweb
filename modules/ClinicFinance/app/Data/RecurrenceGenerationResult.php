<?php

namespace Modules\ClinicFinance\Data;

/** O que o comando diário fez: ocorrências criadas e séries que falharam (por id). */
final readonly class RecurrenceGenerationResult
{
    /**
     * @param  list<int>  $failedSeriesIds
     */
    public function __construct(
        public int $created,
        public array $failedSeriesIds = [],
    ) {}
}
