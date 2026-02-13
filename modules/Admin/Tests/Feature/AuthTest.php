<?php

namespace Modules\Admin\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\User;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function testRegistrationScreenCanBeRendered(): void
    {
        $response = $this->get(route('admin.register'));

        $response->assertOk();
    }

    public function testLoginScreenCanBeRendered(): void
    {
        $response = $this->get(route('admin.login'));

        $response->assertOk();
    }

    public function testGuestsAreRedirectedToLoginWhenVisitingDashboard(): void
    {
        $response = $this->get(route('admin.dashboard'));

        $response->assertRedirect(route('admin.login'));
    }

    public function testAuthenticatedUsersCanVisitDashboard(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->get(route('admin.dashboard'));

        $response->assertOk();
    }

    public function testNewUsersCanRegister(): void
    {
        $response = $this->post('/admin/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('admin.dashboard'));

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'name' => 'Test User',
        ]);
    }

    public function testAuthenticatedUsersCanLogout(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->post(route('admin.logout'));

        $this->assertGuest();
        $response->assertRedirect(route('admin.login'));
    }
}
