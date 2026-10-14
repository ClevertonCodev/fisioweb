<?php

namespace App\Http\Controllers;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Auth;

abstract class ClinicAuthenticatedController extends Controller
{
    protected function clinicUser(): Authenticatable
    {
        $user = Auth::guard('clinic')->user();

        if (is_null($user)) {
            throw new AuthenticationException('Unauthenticated.', ['clinic']);
        }

        return $user;
    }

    protected function clinicId(): int
    {
        return (int) $this->clinicUser()->clinic_id;
    }

    protected function clinicUserId(): int
    {
        return (int) $this->clinicUser()->getAuthIdentifier();
    }
}
