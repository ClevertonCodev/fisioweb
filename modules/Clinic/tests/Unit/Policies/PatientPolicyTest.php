<?php

namespace Modules\Clinic\Tests\Unit\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Policies\PatientPolicy;
use Modules\Patient\Models\Patient;


use Tests\TestCase;

/**
 * Testa a lógica direta da policy. O bypass global para admin vive em Gate::before
 * (ClinicServiceProvider) e é coberto nos testes de feature.
 */
class PatientPolicyTest extends TestCase
{
    private PatientPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new PatientPolicy;
    }

    public function test_any_role_can_view_list(): void
    {
        foreach ([ClinicUser::ROLE_ADMIN, ClinicUser::ROLE_SECRETARY, ClinicUser::ROLE_PHYSIOTHERAPIST] as $role) {
            $this->assertTrue($this->policy->viewAny($this->user($role)), "role=$role");
        }
    }

    public function test_any_role_can_view_single(): void
    {
        $patient = new Patient;
        foreach ([ClinicUser::ROLE_ADMIN, ClinicUser::ROLE_SECRETARY, ClinicUser::ROLE_PHYSIOTHERAPIST] as $role) {
            $this->assertTrue($this->policy->view($this->user($role), $patient), "role=$role");
        }
    }

    public function test_any_role_can_create(): void
    {
        foreach ([ClinicUser::ROLE_ADMIN, ClinicUser::ROLE_SECRETARY, ClinicUser::ROLE_PHYSIOTHERAPIST] as $role) {
            $this->assertTrue($this->policy->create($this->user($role)), "role=$role");
        }
    }

    public function test_any_role_can_update(): void
    {
        $patient = new Patient;
        foreach ([ClinicUser::ROLE_ADMIN, ClinicUser::ROLE_SECRETARY, ClinicUser::ROLE_PHYSIOTHERAPIST] as $role) {
            $this->assertTrue($this->policy->update($this->user($role), $patient), "role=$role");
        }
    }

    public function test_no_role_can_delete_directly_admin_bypass_is_external(): void
    {
        $patient = new Patient;
        foreach ([ClinicUser::ROLE_ADMIN, ClinicUser::ROLE_SECRETARY, ClinicUser::ROLE_PHYSIOTHERAPIST] as $role) {
            $this->assertFalse($this->policy->delete($this->user($role), $patient), "role=$role");
        }
    }

    public function test_secretary_can_bulk_inactivate(): void
    {
        $this->assertTrue($this->policy->bulkInactivate($this->user(ClinicUser::ROLE_SECRETARY)));
    }

    public function test_physiotherapist_cannot_bulk_inactivate(): void
    {
        $this->assertFalse($this->policy->bulkInactivate($this->user(ClinicUser::ROLE_PHYSIOTHERAPIST)));
    }

    public function test_admin_bulk_inactivate_returns_false_directly_admin_bypass_is_external(): void
    {
        $this->assertFalse($this->policy->bulkInactivate($this->user(ClinicUser::ROLE_ADMIN)));
    }

    private function user(string $role, int $id = 1): ClinicUser
    {
        return (new ClinicUser)->forceFill(['id' => $id, 'role' => $role]);
    }
}
