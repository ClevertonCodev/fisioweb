<?php

return [
    'defaults' => [
        'guard'     => env('AUTH_GUARD', 'web'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    'guards' => [
        'web' => [
            'driver'   => 'session',
            'provider' => 'users',
        ],

        'admin' => [
            'driver'   => 'jwt',
            'provider' => 'users',
        ],

        'clinic' => [
            'driver'   => 'jwt',
            'provider' => 'clinic_users',
        ],

        'patient' => [
            'driver'   => 'jwt',
            'provider' => 'patients',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model'  => env('AUTH_MODEL', Modules\Admin\Models\User::class),
        ],

        'clinic_users' => [
            'driver' => 'eloquent',
            'model'  => Modules\Clinic\Models\ClinicUser::class,
        ],

        'patients' => [
            'driver' => 'eloquent',
            'model'  => Modules\Patient\Models\Patient::class,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table'    => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire'   => 60,
            'throttle' => 60,
        ],

        'clinic_users' => [
            'provider' => 'clinic_users',
            'table'    => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire'   => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),
];
