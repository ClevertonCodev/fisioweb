<?php

namespace Modules\Clinic\Observers;

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

class ClinicObserver
{
    public function created(Clinic $clinic): void
    {
        if ($clinic->skipMasterUserObserver) {
            return;
        }

        $email = mb_strtolower(trim((string) $clinic->email));

        // withTrashed: o e-mail de um usuário excluído continua ocupado no índice único.
        if (ClinicUser::withTrashed()->whereRaw('LOWER(email) = ?', [$email])->exists()) {
            return;
        }

        ClinicUser::create([
            'clinic_id'         => $clinic->id,
            'name'              => $clinic->name,
            'email'             => $email,
            'email_verified_at' => now(),
            // Ninguém conhece esta senha: o mestre cria a dele pelo link de primeiro acesso.
            'password'          => Hash::make(Str::random(64)),
            'document'          => $clinic->document,
            'role'              => ClinicUser::ROLE_ADMIN,
            'mestre'            => ClinicUser::MESTRE_YES,
            'status'            => ClinicUser::STATUS_ACTIVE,
        ]);
    }
}
