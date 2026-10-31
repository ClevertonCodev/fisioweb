<?php

namespace Modules\Admin\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Contracts\Public\ExerciseCatalogReadServiceInterface;
use Modules\Admin\Models\BodyRegion;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Tests\TestCase;

class ExerciseCatalogReadServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): ExerciseCatalogReadServiceInterface
    {
        return app(ExerciseCatalogReadServiceInterface::class);
    }

    public function test_returns_prescription_defaults_for_existing_exercise(): void
    {
        $admin      = AdminUser::factory()->create();
        $physioArea = PhysioArea::create(['name' => 'Ombro']);
        $bodyRegion = BodyRegion::create(['name' => 'Ombro']);

        $exercise = Exercise::create([
            'name'           => 'Rotação externa',
            'physio_area_id' => $physioArea->id,
            'body_region_id' => $bodyRegion->id,
            'created_by'     => $admin->id,
            'is_active'      => true,
            'sets'           => 3,
            'repetitions'    => 12,
            'rest_time'      => 30,
        ]);

        $defaults = $this->service()->findPrescriptionDefaults($exercise->id);

        $this->assertNotNull($defaults);
        $this->assertSame($exercise->id, $defaults->exerciseId);
        $this->assertSame(3, $defaults->sets);
        $this->assertSame(12, $defaults->repetitions);
        $this->assertSame(30, $defaults->restTime);
    }

    public function test_returns_null_for_missing_exercise(): void
    {
        $this->assertNull($this->service()->findPrescriptionDefaults(999999));
    }

    public function test_visible_to_clinic_keeps_approved_and_own_exercises_only(): void
    {
        $admin      = AdminUser::factory()->create();
        $physioArea = PhysioArea::create(['name' => 'Joelho']);
        $bodyRegion = BodyRegion::create(['name' => 'Joelho']);
        $make       = fn (array $attributes) => Exercise::create(array_merge([
            'name'           => 'Exercício',
            'physio_area_id' => $physioArea->id,
            'body_region_id' => $bodyRegion->id,
            'created_by'     => $admin->id,
            'is_active'      => true,
        ], $attributes));

        $clinicId     = Clinic::factory()->create()->id;
        $approved     = $make(['review_status' => Exercise::REVIEW_APPROVED]);
        $ownPending   = $make(['review_status' => Exercise::REVIEW_PENDING, 'clinic_id' => $clinicId]);
        $otherPending = $make(['review_status' => Exercise::REVIEW_PENDING, 'clinic_id' => Clinic::factory()->create()->id]);

        $visible = $this->service()->visibleToClinic(
            [$approved->id, $ownPending->id, $otherPending->id, 999999],
            $clinicId,
        );

        sort($visible);
        $this->assertSame([$approved->id, $ownPending->id], $visible);
        $this->assertSame([], $this->service()->visibleToClinic([], $clinicId));
    }
}
