<?php

namespace Modules\ClinicalRecord\Tests\Unit\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicalRecord\Models\EvolutionTemplate;
use Modules\ClinicalRecord\Policies\EvolutionTemplatePolicy;
use Tests\TestCase;

class EvolutionTemplatePolicyTest extends TestCase
{
    private EvolutionTemplatePolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new EvolutionTemplatePolicy;
    }

    public function test_any_role_can_view_any(): void
    {
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->viewAny($this->user($role)));
        }
    }

    public function test_any_role_can_view(): void
    {
        $template = new EvolutionTemplate;
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->view($this->user($role), $template));
        }
    }

    public function test_only_physiotherapist_can_create_directly(): void
    {
        $this->assertTrue($this->policy->create($this->user(ClinicUser::ROLE_PHYSIOTHERAPIST)));
        $this->assertFalse($this->policy->create($this->user(ClinicUser::ROLE_SECRETARY)));
        $this->assertFalse($this->policy->create($this->user(ClinicUser::ROLE_ADMIN)));
    }

    public function test_only_physiotherapist_can_update_directly(): void
    {
        $template = new EvolutionTemplate;
        $this->assertTrue($this->policy->update($this->user(ClinicUser::ROLE_PHYSIOTHERAPIST), $template));
        $this->assertFalse($this->policy->update($this->user(ClinicUser::ROLE_SECRETARY), $template));
        $this->assertFalse($this->policy->update($this->user(ClinicUser::ROLE_ADMIN), $template));
    }

    public function test_no_role_can_delete_directly(): void
    {
        $template = new EvolutionTemplate;
        foreach ($this->allRoles() as $role) {
            $this->assertFalse($this->policy->delete($this->user($role), $template), "role=$role");
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
