<?php

namespace Modules\ClinicScheduling\Contracts\Public;

use Modules\ClinicScheduling\Data\Public\AppointmentExternalEventDTO;

interface AppointmentUpsertFromExternalSourceInterface
{
    /**
     * Cria ou atualiza a consulta do profissional dono do evento. Devolve null, sem
     * alterar nada, quando o evento já está na consulta de outro profissional.
     */
    public function upsertFromExternalSource(AppointmentExternalEventDTO $event): ?int;
}
