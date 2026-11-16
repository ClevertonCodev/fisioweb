<?php

namespace Modules\ClinicalRecord\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\ClinicalRecord\Database\Factories\PatientFileFactory;

class PatientFile extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * Extensão gravada no R2 para cada tipo aceito, pelo conteúdo do arquivo e nunca pelo nome.
     *
     * @var array<string, string>
     */
    public const EXTENSION_BY_MIME = [
        'image/jpeg'                                                              => 'jpg',
        'image/png'                                                               => 'png',
        'application/pdf'                                                         => 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    ];

    protected $table = 'clinic_patient_files';

    protected $hidden = ['file_path', 'cdn_url'];

    protected static function newFactory(): PatientFileFactory
    {
        return PatientFileFactory::new();
    }

    protected $fillable = [
        'clinic_id',
        'patient_id',
        'clinic_user_id',
        'original_name',
        'name',
        'file_path',
        'cdn_url',
        'mime_type',
        'size',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\Clinic::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(\Modules\Patient\Models\Patient::class);
    }

    public function clinicUser(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\ClinicUser::class)->withTrashed();
    }

    public function scopeForClinic($query, int $clinicId)
    {
        return $query->where('clinic_id', $clinicId);
    }
}
