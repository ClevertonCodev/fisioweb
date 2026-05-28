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

    public function test_any_role_can_view_any(): void
    {
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->viewAny($this->user($role)));
        }
    }

    public function test_secretary_can_view_any_user(): void
    {
        $secretary = $this->user(ClinicUser::ROLE_SECRETARY, id: 1);
        $target    = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 2);

        $this->assertTrue($this->policy->view($secretary, $target));
    }

    public function test_physiotherapist_can_view_self(): void
    {
        $user = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 7);

        $this->assertTrue($this->policy->view($user, $user));
    }

    public function test_physiotherapist_cannot_view_other(): void
    {
        $user   = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 7);
        $target = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 8);

        $this->assertFalse($this->policy->view($user, $target));
    }

    public function test_admin_view_returns_false_directly(): void
    {
        // admin passa no Gate::before, não no método da policy
        $admin  = $this->user(ClinicUser::ROLE_ADMIN, id: 1);
        $target = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 2);

        $this->assertFalse($this->policy->view($admin, $target));
    }

    public function test_secretary_can_create(): void
    {
        $this->assertTrue($this->policy->create($this->user(ClinicUser::ROLE_SECRETARY)));
    }

    public function test_physiotherapist_cannot_create(): void
    {
        $this->assertFalse($this->policy->create($this->user(ClinicUser::ROLE_PHYSIOTHERAPIST)));
    }

    public function test_secretary_can_update_any(): void
    {
        $secretary = $this->user(ClinicUser::ROLE_SECRETARY, id: 1);
        $target    = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 2);

        $this->assertTrue($this->policy->update($secretary, $target));
    }

    public function test_physiotherapist_cannot_update(): void
    {
        $user   = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 1);
        $target = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 1);

        $this->assertFalse($this->policy->update($user, $target));
    }

    public function test_secretary_can_delete_non_admin(): void
    {
        $secretary = $this->user(ClinicUser::ROLE_SECRETARY, id: 1);
        $target    = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 2);

        $this->assertTrue($this->policy->delete($secretary, $target));
    }

    public function test_secretary_cannot_delete_admin(): void
    {
        $secretary = $this->user(ClinicUser::ROLE_SECRETARY, id: 1);
        $admin     = $this->user(ClinicUser::ROLE_ADMIN, id: 2);

        $this->assertFalse($this->policy->delete($secretary, $admin));
    }

    public function test_user_cannot_delete_self(): void
    {
        $user = $this->user(ClinicUser::ROLE_SECRETARY, id: 1);

        $this->assertFalse($this->policy->delete($user, $user));
    }

    public function test_physiotherapist_cannot_delete(): void
    {
        $user   = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 1);
        $target = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 2);

        $this->assertFalse($this->policy->delete($user, $target));
    }

    private function allRoles(): array
    {
        return [ClinicUser::ROLE_ADMIN, ClinicUser::ROLE_SECRETARY, ClinicUser::ROLE_PHYSIOTHERAPIST];
    }

    private function user(string $role, int $id = 1): ClinicUser
    {
        return (new ClinicUser)->forceFill(['id' => $id, 'role' => $role]);
    }
}
