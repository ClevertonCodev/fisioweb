<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Media\Models\Video;

class Exercise extends Model
{
    use HasFactory;
    use SoftDeletes;

    public const DIFFICULTY_EASY = 'easy';

    public const DIFFICULTY_MEDIUM = 'medium';

    public const DIFFICULTY_HARD = 'hard';

    public const DIFFICULTIES = [
        self::DIFFICULTY_EASY   => 'Fácil',
        self::DIFFICULTY_MEDIUM => 'Médio',
        self::DIFFICULTY_HARD   => 'Difícil',
    ];

    public const MOVEMENT_FORM_ALTERNADO = 'alternado';

    public const MOVEMENT_FORM_BILATERAL = 'bilateral';

    public const MOVEMENT_FORM_UNILATERAL = 'unilateral';

    public const MOVEMENT_FORMS = [
        self::MOVEMENT_FORM_ALTERNADO  => 'Alternado',
        self::MOVEMENT_FORM_BILATERAL  => 'Bilateral',
        self::MOVEMENT_FORM_UNILATERAL => 'Unilateral',
    ];

    protected $fillable = [
        'name',
        'physio_area_id',
        'physio_subarea_id',
        'body_region_id',
        'therapeutic_goal',
        'description',
        'audio_description',
        'difficulty_level',
        'muscle_group',
        'movement_type',
        'movement_form',
        'kinetic_chain',
        'decubitus',
        'indications',
        'contraindications',
        'frequency',
        'sets',
        'repetitions',
        'rest_time',
        'clinical_notes',
        'created_by',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sets'        => 'integer',
            'repetitions' => 'integer',
            'rest_time'   => 'integer',
            'is_active'   => 'boolean',
            'created_at'  => 'datetime',
        ];
    }

    public function getCreatedAtAttribute($value)
    {
        if (! $value) {
            return null;
        }

        return \Carbon\Carbon::parse($value)->format('d/m/Y H:i');
    }

    // Relacionamentos

    public function physioArea(): BelongsTo
    {
        return $this->belongsTo(PhysioArea::class);
    }

    public function physioSubarea(): BelongsTo
    {
        return $this->belongsTo(PhysioSubarea::class);
    }

    public function bodyRegion(): BelongsTo
    {
        return $this->belongsTo(BodyRegion::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function videos(): BelongsToMany
    {
        return $this->belongsToMany(Video::class, 'exercise_video')->withTimestamps();
    }

    // Scopes

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
