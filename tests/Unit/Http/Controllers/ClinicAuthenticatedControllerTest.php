<?php

namespace Tests\Unit\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Auth;
use Modules\Admin\Models\User;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class ClinicAuthenticatedControllerTest extends TestCase
{
    public function test_clinic_user_returns_user_authenticated_on_clinic_guard(): void
    {
        $user = $this->makeClinicUser(id: 7, clinicId: 3);
        Auth::guard('clinic')->setUser($user);

        $this->assertSame($user, $this->controller()->callClinicUser());
    }

    public function test_clinic_user_throws_authentication_exception_without_user(): void
    {
        try {
            $this->controller()->callClinicUser();
            $this->fail('AuthenticationException não foi lançada.');
        } catch (AuthenticationException $e) {
            $this->assertSame(['clinic'], $e->guards());
        }
    }

    public function test_clinic_id_throws_authentication_exception_without_user(): void
    {
        $this->expectException(AuthenticationException::class);

        $this->controller()->callClinicId();
    }

    public function test_clinic_user_id_throws_authentication_exception_without_user(): void
    {
        $this->expectException(AuthenticationException::class);

        $this->controller()->callClinicUserId();
    }

    public function test_clinic_user_ignores_user_authenticated_on_admin_guard(): void
    {
        $admin = new User;
        $admin->forceFill(['id' => 1, 'clinic_id' => 3]);
        Auth::guard('admin')->setUser($admin);

        $this->expectException(AuthenticationException::class);

        $this->controller()->callClinicId();
    }

    public function test_clinic_id_returns_integer_even_when_attribute_is_string(): void
    {
        Auth::guard('clinic')->setUser($this->makeClinicUser(id: 7, clinicId: '3'));

        $this->assertSame(3, $this->controller()->callClinicId());
    }

    public function test_clinic_user_id_returns_integer_even_when_attribute_is_string(): void
    {
        Auth::guard('clinic')->setUser($this->makeClinicUser(id: '7', clinicId: 3));

        $this->assertSame(7, $this->controller()->callClinicUserId());
    }

    private function makeClinicUser(int|string $id, int|string $clinicId): ClinicUser
    {
        $user = new ClinicUser;
        $user->forceFill(['id' => $id, 'clinic_id' => $clinicId]);

        return $user;
    }

    private function controller(): object
    {
        return new class extends ClinicAuthenticatedController
        {
            public function callClinicUser(): Authenticatable
            {
                return $this->clinicUser();
            }

            public function callClinicId(): int
            {
                return $this->clinicId();
            }

            public function callClinicUserId(): int
            {
                return $this->clinicUserId();
            }
        };
    }
}
