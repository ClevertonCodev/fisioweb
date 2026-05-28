<?php

namespace Modules\Clinic\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

/**
 * @extends Factory<ClinicUser>
 */
class ClinicUserFactory extends Factory
{
    protected $model = ClinicUser::class;

    protected static ?string $password;

    public function definition(): array
    {
        return [
            'clinic_id'         => Clinic::factory(),
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password'          => static::$password ??= Hash::make('password'),
            'role'              => ClinicUser::ROLE_ADMIN,
            'status'            => ClinicUser::STATUS_ACTIVE,
            'remember_token'    => Str::random(10),
        ];
    }
}
