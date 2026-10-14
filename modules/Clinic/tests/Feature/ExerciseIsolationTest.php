<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Media\Models\Video;
use Tests\TestCase;

class ExerciseIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_exercise_is_visible_to_own_clinic_as_own_submission(): void
    {
        $clinic = Clinic::factory()->create();
        ClinicUser::factory()->count(3)->create(['clinic_id' => $clinic->id]);
        $author = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
        // Pré-condição: id do usuário ≠ id da clínica, para que trocar um pelo outro seja detectável.
        $this->assertNotSame($clinic->id, $author->id);
        $video = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);

        $id = $this->actingAs($author, 'clinic')
            ->postJson('/api/clinic/exercises', [
                'name'             => 'Privado A',
                'physio_area_id'   => PhysioArea::create(['name' => 'Ortopedia'])->id,
                'difficulty_level' => Exercise::DIFFICULTY_EASY,
                'description'      => 'Descrição',
                'video_id'         => $video->id,
            ])
            ->assertCreated()
            ->json('data.id');

        $this->assertDatabaseHas('admin_exercises', [
            'id'                          => $id,
            'clinic_id'                   => $clinic->id,
            'submitted_by_clinic_user_id' => $author->id,
        ]);

        $mine = collect($this->actingAs($author, 'clinic')
            ->getJson('/api/clinic/exercises')
            ->assertOk()
            ->json('data.data'))->firstWhere('name', 'Privado A');

        $this->assertNotNull($mine);
        $this->assertTrue($mine['is_own_submission']);
    }
}
