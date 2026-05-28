<?php

namespace Modules\Clinic\Tests\Unit\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\PatientQuestionnaire;
use Modules\Clinic\Policies\PatientQuestionnairePolicy;
use Tests\TestCase;

class PatientQuestionnairePolicyTest extends TestCase
{
    private PatientQuestionnairePolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new PatientQuestionnairePolicy;
    }

    public function test_any_role_can_view_any(): void
    {
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->viewAny($this->user($role)));
        }
    }

    public function test_any_role_can_view(): void
    {
        $questionnaire = new PatientQuestionnaire;
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->view($this->user($role), $questionnaire));
        }
    }

    public function test_any_role_can_create(): void
    {
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->create($this->user($role)));
        }
    }

    public function test_physiotherapist_can_delete_own(): void
    {
        $user          = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 7);
        $questionnaire = (new PatientQuestionnaire)->forceFill(['clinic_user_id' => 7]);

        $this->assertTrue($this->policy->delete($user, $questionnaire));
    }

    public function test_physiotherapist_cannot_delete_other(): void
    {
        $user          = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 7);
        $questionnaire = (new PatientQuestionnaire)->forceFill(['clinic_user_id' => 99]);

        $this->assertFalse($this->policy->delete($user, $questionnaire));
    }

    public function test_secretary_cannot_delete(): void
    {
        $user          = $this->user(ClinicUser::ROLE_SECRETARY, id: 7);
        $questionnaire = (new PatientQuestionnaire)->forceFill(['clinic_user_id' => 7]);

        $this->assertFalse($this->policy->delete($user, $questionnaire));
    }

    public function test_admin_delete_returns_false_directly(): void
    {
        $user          = $this->user(ClinicUser::ROLE_ADMIN, id: 7);
        $questionnaire = (new PatientQuestionnaire)->forceFill(['clinic_user_id' => 99]);

        $this->assertFalse($this->policy->delete($user, $questionnaire));
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
