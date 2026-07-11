<?php

namespace Modules\Admin\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Contracts\Public\ExerciseCatalogReadServiceInterface;
use Modules\Admin\Models\BodyRegion;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
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
}
