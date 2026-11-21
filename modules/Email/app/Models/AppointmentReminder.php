<?php

namespace Modules\Email\Models;

use Illuminate\Database\Eloquent\Model;

class AppointmentReminder extends Model
{
    protected $table = 'email_appointment_reminders';

    public $timestamps = false;

    protected $fillable = [
        'clinic_id',
        'appointment_id',
        'starts_at',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'sent_at'   => 'datetime',
        ];
    }
}
