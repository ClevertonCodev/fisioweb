<?php

namespace Modules\TreatmentProgram\Tests\Unit\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Policies\TreatmentPlanPolicy;
use Tests\TestCase;

/**
 * Testa a lógica direta da policy. Admin bypass vive em Gate::before.
 */
class TreatmentPlanPolicyTest extends TestCase
{
    private TreatmentPlanPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new TreatmentPlanPolicy;
    }

    public function test_any_role_can_view_any(): void
    {
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->viewAny($this->user($role)));
        }
    }

    public function test_any_role_can_view(): void
    {
        $plan = new TreatmentPlan;
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->view($this->user($role), $plan));
        }
    }

    public function test_any_role_can_create(): void
    {
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->create($this->user($role)));
        }
    }

    public function test_any_role_can_update(): void
    {
        $plan = new TreatmentPlan;
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->update($this->user($role), $plan));
        }
    }

    public function test_any_role_can_duplicate(): void
    {
        $plan = new TreatmentPlan;
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->duplicate($this->user($role), $plan));
        }
    }

    public function test_no_role_can_delete_directly(): void
    {
        $plan = new TreatmentPlan;
        foreach ($this->allRoles() as $role) {
            $this->assertFalse($this->policy->delete($this->user($role), $plan), "role=$role");
        }
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
