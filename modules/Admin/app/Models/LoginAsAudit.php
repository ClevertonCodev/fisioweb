<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginAsAudit extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'admin_login_as_audits';

    protected $fillable = [
        'admin_user_id',
        'clinic_id',
        'clinic_user_id',
        'ip',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }
}
