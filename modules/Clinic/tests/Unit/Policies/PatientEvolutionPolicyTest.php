<?php

namespace Modules\Clinic\Tests\Unit\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\PatientEvolution;
use Modules\Clinic\Policies\PatientEvolutionPolicy;
use Tests\TestCase;

class PatientEvolutionPolicyTest extends TestCase
{
    private PatientEvolutionPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new PatientEvolutionPolicy;
    }

    public function test_any_role_can_view_any(): void
    {
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->viewAny($this->user($role)));
        }
    }

    public function test_any_role_can_view(): void
    {
        $evolution = new PatientEvolution;
        foreach ($this->allRoles() as $role) {
            $this->assertTrue($this->policy->view($this->user($role), $evolution));
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
        $user      = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 3);
        $evolution = (new PatientEvolution)->forceFill(['clinic_user_id' => 3]);

        $this->assertTrue($this->policy->update($user, $evolution));
    }

    public function test_physiotherapist_cannot_update_other(): void
    {
        $user      = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 3);
        $evolution = (new PatientEvolution)->forceFill(['clinic_user_id' => 99]);

        $this->assertFalse($this->policy->update($user, $evolution));
    }

    public function test_secretary_cannot_update(): void
    {
        $user      = $this->user(ClinicUser::ROLE_SECRETARY, id: 3);
        $evolution = (new PatientEvolution)->forceFill(['clinic_user_id' => 3]);

        $this->assertFalse($this->policy->update($user, $evolution));
    }

    public function test_physiotherapist_can_generate_text_for_own(): void
    {
        $user      = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 3);
        $evolution = (new PatientEvolution)->forceFill(['clinic_user_id' => 3]);

        $this->assertTrue($this->policy->generateText($user, $evolution));
    }

    public function test_physiotherapist_cannot_generate_text_for_other(): void
    {
        $user      = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 3);
        $evolution = (new PatientEvolution)->forceFill(['clinic_user_id' => 99]);

        $this->assertFalse($this->policy->generateText($user, $evolution));
    }

    public function test_physiotherapist_can_sign_own(): void
    {
        $user      = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 3);
        $evolution = (new PatientEvolution)->forceFill(['clinic_user_id' => 3]);

        $this->assertTrue($this->policy->sign($user, $evolution));
    }

    public function test_physiotherapist_cannot_sign_other(): void
    {
        $user      = $this->user(ClinicUser::ROLE_PHYSIOTHERAPIST, id: 3);
        $evolution = (new PatientEvolution)->forceFill(['clinic_user_id' => 99]);

        $this->assertFalse($this->policy->sign($user, $evolution));
    }

    public function test_secretary_cannot_sign(): void
    {
        $user      = $this->user(ClinicUser::ROLE_SECRETARY, id: 3);
        $evolution = (new PatientEvolution)->forceFill(['clinic_user_id' => 3]);

        $this->assertFalse($this->policy->sign($user, $evolution));
    }

    public function test_no_role_can_delete_directly(): void
    {
        $evolution = new PatientEvolution;
        foreach ($this->allRoles() as $role) {
            $this->assertFalse($this->policy->delete($this->user($role), $evolution), "role=$role");
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
