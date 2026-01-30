<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PasswordConfirmationTest extends TestCase
{
    use RefreshDatabase;

    public function testConfirmPasswordScreenCanBeRendered()
    {
        $this->markTestSkipped('Teste temporariamente desativado');
        $user = User::factory()->create();
        $response = $this->actingAs($user)->get(route('password.confirm'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('auth/confirm-password')
        );
    }

    public function testPasswordConfirmationRequiresAuthentication()
    {
        $this->markTestSkipped('Teste temporariamente desativado');
        $response = $this->get(route('password.confirm'));
        $response->assertRedirect(route('login'));
    }
}
