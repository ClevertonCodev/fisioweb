<?php

namespace Modules\ClinicalRecord\Tests\Unit\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicalRecord\Models\PatientFile;
use Modules\ClinicalRecord\Policies\PatientFilePolicy;
use Tests\TestCase;

class PatientFilePolicyTest extends TestCase
{
    private PatientFilePolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new PatientFilePolicy;
    }

    public function test_any_role_can_view_any(): void
    {
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->viewAny($this->user($role)));
        }
    }

    public function test_any_role_can_view(): void
    {
        $file = new PatientFile;
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->view($this->user($role), $file));
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
        $user = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 12);
        $file = (new PatientFile)->forceFill(['clinic_user_id' => 12]);

        $this->assertTrue($this->policy->delete($user, $file));
    }

    public function test_physiotherapist_cannot_delete_other(): void
    {
        $user = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 12);
        $file = (new PatientFile)->forceFill(['clinic_user_id' => 99]);

        $this->assertFalse($this->policy->delete($user, $file));
    }

    public function test_secretary_cannot_delete(): void
    {
        $user = $this->user(ClinicUser::ROLE_SECRETARY, id: 12);
        $file = (new PatientFile)->forceFill(['clinic_user_id' => 12]);

        $this->assertFalse($this->policy->delete($user, $file));
    }

    public function test_admin_delete_returns_false_directly(): void
    {
        $user = $this->user(ClinicUser::ROLE_ADMIN, id: 12);
        $file = (new PatientFile)->forceFill(['clinic_user_id' => 99]);

        $this->assertFalse($this->policy->delete($user, $file));
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
