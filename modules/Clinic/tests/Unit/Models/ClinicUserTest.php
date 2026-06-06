<?php

namespace Modules\Clinic\Tests\Unit\Models;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\PatientEvolution;
use Tests\TestCase;

class ClinicUserTest extends TestCase
{
    public function test_is_master_returns_true_when_mestre_is_one(): void
    {
        $user = (new ClinicUser)->forceFill(['mestre' => ClinicUser::MESTRE_YES]);

        $this->assertTrue($user->isMaster());
    }

    public function test_is_master_returns_false_when_mestre_is_zero(): void
    {
        $user = (new ClinicUser)->forceFill(['mestre' => ClinicUser::MESTRE_NO]);

        $this->assertFalse($user->isMaster());
    }

    public function test_is_admin_returns_true_when_role_is_admin(): void
    {
        $user = (new ClinicUser)->forceFill(['role' => ClinicUser::ROLE_ADMIN]);

        $this->assertTrue($user->isAdmin());
        $this->assertFalse($user->isSecretary());
        $this->assertFalse($user->isPhysiotherapist());
    }

    public function test_is_secretary_returns_true_when_role_is_secretary(): void
    {
        $user = (new ClinicUser)->forceFill(['role' => ClinicUser::ROLE_SECRETARY]);

        $this->assertFalse($user->isAdmin());
        $this->assertTrue($user->isSecretary());
        $this->assertFalse($user->isPhysiotherapist());
    }

    public function test_is_physiotherapist_returns_true_when_role_is_physiotherapist(): void
    {
        $user = (new ClinicUser)->forceFill(['role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        $this->assertFalse($user->isAdmin());
        $this->assertFalse($user->isSecretary());
        $this->assertTrue($user->isPhysiotherapist());
    }

    public function test_owns_returns_true_when_record_clinic_user_id_matches_user_id(): void
    {
        $user   = (new ClinicUser)->forceFill(['id' => 5]);
        $record = (new PatientEvolution)->forceFill(['clinic_user_id' => 5]);

        $this->assertTrue($user->owns($record));
    }

    public function test_owns_returns_false_when_record_clinic_user_id_differs(): void
    {
        $user   = (new ClinicUser)->forceFill(['id' => 5]);
        $record = (new PatientEvolution)->forceFill(['clinic_user_id' => 9]);

        $this->assertFalse($user->owns($record));
    }

    public function test_owns_returns_false_when_record_has_no_clinic_user_id(): void
    {
        $user   = (new ClinicUser)->forceFill(['id' => 5]);
        $record = new PatientEvolution;

        $this->assertFalse($user->owns($record));
    }
}
