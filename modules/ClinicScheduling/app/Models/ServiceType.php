<?php

namespace Modules\ClinicScheduling\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Tipo de serviço da clínica: atalho do modal de consulta com duração padrão.
 * O apagado fica com soft delete para a clínica não receber os padrão de novo.
 */
class ServiceType extends Model
{
    use SoftDeletes;

    protected $table = 'clinic_service_types';

    protected $fillable = [
        'clinic_id',
        'name',
        'duration_minutes',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'clinic_id'        => 'integer',
            'duration_minutes' => 'integer',
            'position'         => 'integer',
        ];
    }
}
