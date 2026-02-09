<?php

namespace Modules\Admin\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\User;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function testCanCreateUserViaFactory(): void
    {
        $user = User::factory()->create([
            'name' => 'João Silva',
            'email' => 'joao@exemplo.com',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'joao@exemplo.com',
            'name' => 'João Silva',
        ]);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('João Silva', $user->name);
        $this->assertEquals('joao@exemplo.com', $user->email);
        $this->assertNotNull($user->password);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('password', $user->password));
    }

    public function testCanCreateUserDirectly(): void
    {
        $user = User::create([
            'name' => 'Maria Santos',
            'email' => 'maria@exemplo.com',
            'password' => 'senha123',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'maria@exemplo.com',
            'name' => 'Maria Santos',
        ]);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('Maria Santos', $user->name);
        $this->assertEquals('maria@exemplo.com', $user->email);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('senha123', $user->password));
    }

    public function testUserHasExpectedAttributes(): void
    {
        $user = User::factory()->create();

        $this->assertArrayHasKey('name', $user->getAttributes());
        $this->assertArrayHasKey('email', $user->getAttributes());
        $this->assertArrayHasKey('password', $user->getAttributes());
        $this->assertNotNull($user->name);
        $this->assertNotNull($user->email);
    }
}
