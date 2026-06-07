<?php

namespace Modules\Clinic\Tests\Unit\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Policies\ClinicUserPolicy;
use Tests\TestCase;

class ClinicUserPolicyTest extends TestCase
{
    private ClinicUserPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new ClinicUserPolicy;
    }

    public function test_non_admin_cannot_view_any(): void
    {
        foreach ($this->nonAdminRoles() as $role) {
            $this->assertFalse($this->policy->viewAny($this->user($role)));
        }
    }

    public function test_non_admin_can_view_self(): void
    {
        foreach ($this->nonAdminRoles() as $role) {
            $user = $this->user($role, id: 7);

            $this->assertTrue($this->policy->view($user, $user));
        }
    }

    public function test_non_admin_cannot_view_other(): void
    {
        $user   = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 7);
        $target = $this->user(ClinicUser::ROLE_SECRETARY, id: 8);

        $this->assertFalse($this->policy->view($user, $target));
    }

    public function test_non_admin_cannot_create(): void
    {
        foreach ($this->nonAdminRoles() as $role) {
            $this->assertFalse($this->policy->create($this->user($role)));
        }
    }

    public function test_non_admin_can_update_self(): void
    {
        $user = $this->user(ClinicUser::ROLE_SECRETARY, id: 3);

        $this->assertTrue($this->policy->update($user, $user));
    }

    public function test_non_admin_cannot_update_other(): void
    {
        $user   = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 1);
        $target = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 2);

        $this->assertFalse($this->policy->update($user, $target));
    }

    public function test_non_admin_cannot_delete(): void
    {
        $user   = $this->user(ClinicUser::ROLE_SECRETARY, id: 1);
        $target = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 2);

        $this->assertFalse($this->policy->delete($user, $target));
        $this->assertFalse($this->policy->delete($user, $user));
    }

    private function nonAdminRoles(): array
    {
        return [ClinicUser::ROLE_SECRETARY, ClinicUser::ROLE_PHYSIOTHERAPIST];
    }

    private function user(string $role, int $id = 1): ClinicUser
    {
        return (new ClinicUser)->forceFill(['id' => $id, 'role' => $role]);
    }
}
