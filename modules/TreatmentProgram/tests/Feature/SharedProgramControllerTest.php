<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\AdminProgram;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class SharedProgramControllerTest extends TestCase
{
    use RefreshDatabase;

    private function makeProgram(int $adminId, int $physioAreaId, string $title, bool $active): AdminProgram
    {
        return AdminProgram::create([
            'created_by'     => $adminId,
            'title'          => $title,
            'physio_area_id' => $physioAreaId,
            'is_active'      => $active,
        ]);
    }

    public function test_index_lists_only_active_programs_with_exercise_count(): void
    {
        $admin      = AdminUser::factory()->create();
        $physioArea = PhysioArea::create(['name' => 'Coluna']);
        $clinicUser = ClinicUser::factory()->create();

        $this->makeProgram($admin->id, $physioArea->id, 'Programa Ativo', true);
        $this->makeProgram($admin->id, $physioArea->id, 'Programa Inativo', false);

        $response = $this->actingAs($clinicUser, 'clinic')->getJson('/api/clinic/programs');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Programa Ativo')
            ->assertJsonPath('data.0.exercises_count', 0);
    }

    public function test_show_returns_active_program_with_data_envelope(): void
    {
        $admin      = AdminUser::factory()->create();
        $physioArea = PhysioArea::create(['name' => 'Coluna']);
        $clinicUser = ClinicUser::factory()->create();

        $program = $this->makeProgram($admin->id, $physioArea->id, 'Programa X', true);

        $this->actingAs($clinicUser, 'clinic')
            ->getJson("/api/clinic/programs/{$program->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $program->id)
            ->assertJsonPath('data.title', 'Programa X');
    }

    public function test_show_returns_404_for_inactive_program(): void
    {
        $admin      = AdminUser::factory()->create();
        $physioArea = PhysioArea::create(['name' => 'Coluna']);
        $clinicUser = ClinicUser::factory()->create();

        $program = $this->makeProgram($admin->id, $physioArea->id, 'Inativo', false);

        $this->actingAs($clinicUser, 'clinic')
            ->getJson("/api/clinic/programs/{$program->id}")
            ->assertNotFound();
    }
}
