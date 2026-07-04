<?php

namespace Modules\TreatmentProgram\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicProgramDraft extends Model
{
    protected $fillable = ['clinic_id', 'clinic_user_id', 'draft_data'];

    protected $casts = [
        'draft_data' => 'array',
    ];

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\Clinic::class);
    }

    public function clinicUser(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\ClinicUser::class);
    }
}
