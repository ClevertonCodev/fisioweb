<?php

namespace Modules\Admin\Tests\Unit;

use Modules\Admin\Http\Controllers\PasswordResetController;
use Tests\TestCase;

class PasswordResetControllerTest extends TestCase
{
    private PasswordResetController $controller;

    protected function setUp(): void
    {
        parent::setUp();

        $this->controller = new PasswordResetController;
    }

    public function test_broker_name_returns_users(): void
    {
        $this->assertSame('users', $this->callProtected('brokerName'));
    }

    public function test_reset_frontend_path_returns_admin_path(): void
    {
        $this->assertSame('admin/redefinir-senha', $this->callProtected('resetFrontendPath'));
    }

    private function callProtected(string $method): mixed
    {
        $reflection = new \ReflectionMethod($this->controller, $method);
        $reflection->setAccessible(true);

        return $reflection->invoke($this->controller);
    }
}
