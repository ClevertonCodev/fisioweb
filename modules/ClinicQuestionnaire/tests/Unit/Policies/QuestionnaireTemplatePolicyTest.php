<?php

namespace Modules\ClinicQuestionnaire\Tests\Unit\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Modules\ClinicQuestionnaire\Policies\QuestionnaireTemplatePolicy;
use Tests\TestCase;

class QuestionnaireTemplatePolicyTest extends TestCase
{
    private QuestionnaireTemplatePolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new QuestionnaireTemplatePolicy;
    }

    public function test_any_role_can_view_any(): void
    {
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->viewAny($this->user($role)));
        }
    }

    public function test_any_role_can_view(): void
    {
        $template = new QuestionnaireTemplate;
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->view($this->user($role), $template));
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
        $template = new QuestionnaireTemplate;
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->update($this->user($role), $template));
        }
    }

    public function test_no_role_can_delete_directly(): void
    {
        $template = new QuestionnaireTemplate;
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
