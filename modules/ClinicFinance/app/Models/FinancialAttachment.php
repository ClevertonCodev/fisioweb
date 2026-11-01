<?php

namespace Modules\ClinicFinance\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Comprovante de um lançamento. O `path` no R2 nunca vai para a API: o arquivo
 * só abre pelo link assinado de `GET .../attachments/{id}/url`. Ele fica no bucket
 * que o CDN serve; quem barra `clinics/x/finances/` no CDN é uma regra de WAF,
 * pré-requisito de deploy (ADR 026).
 */
class FinancialAttachment extends Model
{
    public const MAX_PER_TRANSACTION = 5;

    public const MAX_SIZE_KB = 10240;

    /** Extensões aceitas (o `mimes` do Laravel confere pelo conteúdo do arquivo). */
    public const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf'];

    /**
     * Extensão gravada no R2 para cada tipo aceito. O tipo vem do conteúdo do arquivo,
     * nunca do nome: um `x.html` que começa com `%PDF` é gravado como `.pdf`.
     */
    public const EXTENSION_BY_MIME = [
        'image/jpeg'      => 'jpg',
        'image/png'       => 'png',
        'image/webp'      => 'webp',
        'image/heic'      => 'heic',
        'image/heif'      => 'heif',
        'application/pdf' => 'pdf',
    ];

    protected $table = 'clinic_financial_attachments';

    protected $fillable = [
        'clinic_id',
        'financial_transaction_id',
        'path',
        'original_name',
        'mime_type',
        'size',
        'uploaded_by_user_id',
    ];

    protected $hidden = ['path'];

    protected function casts(): array
    {
        return [
            'clinic_id'                => 'integer',
            'financial_transaction_id' => 'integer',
            'size'                     => 'integer',
            'uploaded_by_user_id'      => 'integer',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(FinancialTransaction::class, 'financial_transaction_id');
    }

    public function scopeForClinic(Builder $query, int $clinicId): Builder
    {
        return $query->where($this->getTable() . '.clinic_id', $clinicId);
    }
}
