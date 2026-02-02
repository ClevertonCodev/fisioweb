<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\User;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function testGuestsAreRedirectedToTheLoginPage()
    {
        $this->get(route('admin.dashboard'))->assertRedirect(route('admin.login'));
    }

    public function testAuthenticatedUsersCanVisitTheDashboard()
    {
        $this->actingAs(User::factory()->create());

        $this->get(route('admin.dashboard'))->assertOk();
    }
}
