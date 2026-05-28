<?php

namespace Modules\Clinic\Tests\Unit\Policies;

use Modules\Clinic\Models\Assessment;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Policies\AssessmentPolicy;
use Tests\TestCase;

class AssessmentPolicyTest extends TestCase
{
    private AssessmentPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new AssessmentPolicy;
    }

    public function test_any_role_can_view_any(): void
    {
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->viewAny($this->user($role)));
        }
    }

    public function test_any_role_can_view(): void
    {
        $assessment = new Assessment;
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->view($this->user($role), $assessment));
        }
    }

    public function test_only_physiotherapist_can_create(): void
    {
        $this->assertTrue($this->policy->create($this->user(ClinicUser::ROLE_PHYSIOTHERAPIST)));
        $this->assertFalse($this->policy->create($this->user(ClinicUser::ROLE_SECRETARY)));
        $this->assertFalse($this->policy->create($this->user(ClinicUser::ROLE_ADMIN)));
    }

    public function test_physiotherapist_can_update_own(): void
    {
        $user       = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 10);
        $assessment = (new Assessment)->forceFill(['clinic_user_id' => 10]);

        $this->assertTrue($this->policy->update($user, $assessment));
    }

    public function test_physiotherapist_cannot_update_other(): void
    {
        $user       = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 10);
        $assessment = (new Assessment)->forceFill(['clinic_user_id' => 99]);

        $this->assertFalse($this->policy->update($user, $assessment));
    }

    public function test_secretary_cannot_update(): void
    {
        $user       = $this->user(ClinicUser::ROLE_SECRETARY, id: 10);
        $assessment = (new Assessment)->forceFill(['clinic_user_id' => 10]);

        $this->assertFalse($this->policy->update($user, $assessment));
    }

    public function test_physiotherapist_can_sign_own(): void
    {
        $user       = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 10);
        $assessment = (new Assessment)->forceFill(['clinic_user_id' => 10]);

        $this->assertTrue($this->policy->sign($user, $assessment));
    }

    public function test_physiotherapist_cannot_sign_other(): void
    {
        $user       = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 10);
        $assessment = (new Assessment)->forceFill(['clinic_user_id' => 99]);

        $this->assertFalse($this->policy->sign($user, $assessment));
    }

    public function test_secretary_cannot_sign(): void
    {
        $user       = $this->user(ClinicUser::ROLE_SECRETARY, id: 10);
        $assessment = (new Assessment)->forceFill(['clinic_user_id' => 10]);

        $this->assertFalse($this->policy->sign($user, $assessment));
    }

    public function test_no_role_can_delete_directly(): void
    {
        $assessment = new Assessment;
        foreach ($this->allRoles() as $role) {
            $this->assertFalse($this->policy->delete($this->user($role), $assessment), "role=$role");
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
