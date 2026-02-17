<?php

namespace Modules\Clinic\Observers;

use Illuminate\Support\Facades\Hash;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

class ClinicObserver
{
    public function created(Clinic $clinic): void
    {
        if (ClinicUser::where('email', $clinic->email)->exists()) {
            return;
        }

        ClinicUser::create([
            'clinic_id' => $clinic->id,
            'name'      => $clinic->name,
            'email'     => $clinic->email,
            'password'  => Hash::make($clinic->document),
            'document'  => $clinic->document,
            'role'      => ClinicUser::ROLE_ADMIN,
            'status'    => ClinicUser::STATUS_ACTIVE,
        ]);
    }
}
