<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Admin\Models\Plan;
use Modules\Clinic\Database\Factories\ClinicFactory;
use Modules\Patient\Models\Patient;

class Clinic extends Model
{
    use HasFactory, SoftDeletes;

    protected static function newFactory(): ClinicFactory
    {
        return ClinicFactory::new();
    }

    public const STATUS_ACTIVE = 1;

    public const STATUS_INACTIVE = 0;

    public const STATUS_CANCELLED = -1;

    public const TYPE_PERSON_FISICA = 'fisica';

    public const TYPE_PERSON_JURIDICA = 'juridica';

    /** Janela de atendimento padrão quando a clínica não a configurou (FR-019a). */
    public const DEFAULT_WORKING_START = '08:00';

    public const DEFAULT_WORKING_END = '18:00';

    public const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5];

    protected $fillable = [
        'name',
        'email',
        'document',
        'type_person',
        'status',
        'slug',
        'zip_code',
        'address',
        'number',
        'city',
        'state',
        'phone',
        'timezone',
        'working_start',
        'working_end',
        'working_days',
        'plan_id',
    ];

    protected function casts(): array
    {
        return [
            'status'       => 'integer',
            'working_days' => 'array',
        ];
    }

    /**
     * Janela de atendimento usada como denominador da Taxa de ocupação.
     *
     * @return array{start:string,end:string,days:int[]}
     */
    public function workingWindow(): array
    {
        return [
            'start' => $this->normalizeTime($this->working_start, self::DEFAULT_WORKING_START),
            'end'   => $this->normalizeTime($this->working_end, self::DEFAULT_WORKING_END),
            'days'  => !empty($this->working_days) ? array_map('intval', $this->working_days) : self::DEFAULT_WORKING_DAYS,
        ];
    }

    private function normalizeTime(?string $value, string $default): string
    {
        return $value ? substr($value, 0, 5) : $default;
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function clinicUsers(): HasMany
    {
        return $this->hasMany(ClinicUser::class);
    }

    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class);
    }

    public function treatmentPlans(): HasMany
    {
        return $this->hasMany(\Modules\TreatmentProgram\Models\TreatmentPlan::class);
    }
}
