<?php

namespace Modules\ClinicScheduling\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicScheduling\Data\ServiceTypeData;
use Modules\ClinicScheduling\Models\ServiceType;

interface ServiceTypeServiceInterface
{
    /**
     * Tipos da clínica em ordem. Na primeira leitura de uma clínica que nunca
     * teve tipos, grava os padrão.
     *
     * @return Collection<int, ServiceType>
     */
    public function listForClinic(int $clinicId): Collection;

    /**
     * Substitui a lista inteira: a ordem vira `position`, item com `id`
     * atualiza, sem `id` cria, e o que não veio é apagado.
     *
     * @param  list<ServiceTypeData>  $items
     * @return Collection<int, ServiceType>
     */
    public function replace(int $clinicId, array $items): Collection;
}
