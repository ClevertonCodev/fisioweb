<?php

namespace Modules\Patient\Data\Public;

/** O mínimo do paciente para outro módulo mostrar quem é: id e nome. */
final readonly class PatientNameDTO
{
    public function __construct(
        public int $id,
        public string $name,
    ) {}
}
