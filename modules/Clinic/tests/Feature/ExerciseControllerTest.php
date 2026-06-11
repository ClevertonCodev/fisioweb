<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\BodyRegion;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\ExerciseFavorite;
use Tests\TestCase;

class ExerciseControllerTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $clinicUser;

    private AdminUser $adminUser;

    private PhysioArea $physioArea;

    private BodyRegion $bodyRegion;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinicUser = ClinicUser::factory()->create();
        $this->adminUser  = AdminUser::factory()->create();
        $this->physioArea = PhysioArea::create(['name' => 'Ortopedia']);
        $this->bodyRegion = BodyRegion::create(['name' => 'Joelho']);
    }

    private function makeExercise(array $overrides = []): Exercise
    {
        return Exercise::create(array_merge([
            'name'           => fake()->words(3, true),
            'physio_area_id' => $this->physioArea->id,
            'body_region_id' => $this->bodyRegion->id,
            'created_by'     => $this->adminUser->id,
            'is_active'      => true,
        ], $overrides));
    }

    // --- index ---

    public function test_index_returns_exercises_with_is_favorite_false_by_default(): void
    {
        $exercise = $this->makeExercise();

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/exercises');

        $response->assertOk();

        $items = $response->json('data.data');
        $found = collect($items)->firstWhere('id', $exercise->id);
        $this->assertNotNull($found);
        $this->assertFalse($found['is_favorite']);
    }

    public function test_index_marks_favorited_exercise_as_is_favorite_true(): void
    {
        $exercise = $this->makeExercise();

        ExerciseFavorite::create([
            'clinic_user_id' => $this->clinicUser->id,
            'exercise_id'    => $exercise->id,
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/exercises');

        $response->assertOk();

        $items = $response->json('data.data');
        $found = collect($items)->firstWhere('id', $exercise->id);
        $this->assertTrue($found['is_favorite']);
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/clinic/exercises')->assertUnauthorized();
    }

    // --- toggleFavorite ---

    public function test_toggle_favorite_adds_favorite_when_not_yet_favorited(): void
    {
        $exercise = $this->makeExercise();

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/exercises/{$exercise->id}/favorite");

        $response->assertOk()
            ->assertJson(['data' => ['exercise_id' => $exercise->id, 'is_favorite' => true]]);

        $this->assertDatabaseHas('clinic_exercise_favorites', [
            'clinic_user_id' => $this->clinicUser->id,
            'exercise_id'    => $exercise->id,
        ]);
    }

    public function test_toggle_favorite_removes_favorite_when_already_favorited(): void
    {
        $exercise = $this->makeExercise();

        ExerciseFavorite::create([
            'clinic_user_id' => $this->clinicUser->id,
            'exercise_id'    => $exercise->id,
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/exercises/{$exercise->id}/favorite");

        $response->assertOk()
            ->assertJson(['data' => ['exercise_id' => $exercise->id, 'is_favorite' => false]]);

        $this->assertDatabaseMissing('clinic_exercise_favorites', [
            'clinic_user_id' => $this->clinicUser->id,
            'exercise_id'    => $exercise->id,
        ]);
    }

    public function test_toggle_favorite_returns_404_for_nonexistent_exercise(): void
    {
        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/exercises/999999/favorite');

        $response->assertNotFound()
            ->assertJson(['message' => 'Exercício não encontrado.']);
    }

    public function test_toggle_favorite_does_not_affect_other_clinic_users_favorites(): void
    {
        $otherUser = ClinicUser::factory()->create();
        $exercise  = $this->makeExercise();

        ExerciseFavorite::create([
            'clinic_user_id' => $otherUser->id,
            'exercise_id'    => $exercise->id,
        ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/exercises/{$exercise->id}/favorite");

        $this->assertDatabaseHas('clinic_exercise_favorites', [
            'clinic_user_id' => $otherUser->id,
            'exercise_id'    => $exercise->id,
        ]);
    }

    public function test_toggle_favorite_requires_authentication(): void
    {
        $exercise = $this->makeExercise();

        $this->postJson("/api/clinic/exercises/{$exercise->id}/favorite")
            ->assertUnauthorized();
    }

    // --- favorites ---

    public function test_favorites_returns_only_favorited_exercises(): void
    {
        $favorited    = $this->makeExercise(['name' => 'Favorito']);
        $notFavorited = $this->makeExercise(['name' => 'Não Favorito']);

        ExerciseFavorite::create([
            'clinic_user_id' => $this->clinicUser->id,
            'exercise_id'    => $favorited->id,
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/favorites');

        $response->assertOk();

        $ids = collect($response->json('data.data'))->pluck('id');
        $this->assertTrue($ids->contains($favorited->id));
        $this->assertFalse($ids->contains($notFavorited->id));
    }

    public function test_favorites_returns_empty_when_no_favorites(): void
    {
        $this->makeExercise();

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/favorites');

        $response->assertOk();
        $this->assertEmpty($response->json('data.data'));
    }

    public function test_favorites_does_not_return_other_clinic_users_favorites(): void
    {
        $otherUser = ClinicUser::factory()->create();
        $exercise  = $this->makeExercise();

        ExerciseFavorite::create([
            'clinic_user_id' => $otherUser->id,
            'exercise_id'    => $exercise->id,
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/favorites');

        $response->assertOk();
        $this->assertEmpty($response->json('data.data'));
    }

    public function test_favorites_requires_authentication(): void
    {
        $this->getJson('/api/clinic/favorites')->assertUnauthorized();
    }
}
