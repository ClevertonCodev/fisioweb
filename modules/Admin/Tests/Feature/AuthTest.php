<?php

namespace Modules\Admin\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\User;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get(route('admin.register'));

        $response->assertOk();
    }

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get(route('admin.login'));

        $response->assertOk();
    }

    public function test_guests_are_redirected_to_login_when_visiting_dashboard(): void
    {
        $response = $this->get(route('admin.dashboard'));

        $response->assertRedirect(route('admin.login'));
    }

    public function test_authenticated_users_can_visit_dashboard(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->get(route('admin.dashboard'));

        $response->assertOk();
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/admin/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'password'              => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('admin.dashboard'));

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'name'  => 'Test User',
        ]);
    }

    public function test_authenticated_users_can_logout(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->post(route('admin.logout'));

        $this->assertGuest();
        $response->assertRedirect(route('admin.login'));
    }
}
