<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Media\Models\Video;
use Tests\TestCase;

class ExerciseMediaProposalPendingTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinicA;

    private Clinic $clinicB;

    private PhysioArea $area;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinicA = Clinic::factory()->create();
        $this->clinicB = Clinic::factory()->create();
        $this->area    = PhysioArea::create(['name' => 'Ortopedia']);
    }

    public function test_only_owner_clinic_sees_media_proposal_pending(): void
    {
        $withProposal    = $this->exercise('Com proposta', $this->clinicA->id, Exercise::REVIEW_APPROVED, $this->videoOfA(withProposal: true));
        $withoutProposal = $this->exercise('Sem proposta', $this->clinicA->id, Exercise::REVIEW_APPROVED, $this->videoOfA(withProposal: false));
        $global          = $this->exercise('Global', null, Exercise::REVIEW_APPROVED, $this->videoOfA(withProposal: true));

        $seenByA = $this->listedBy($this->clinicA);
        $this->assertTrue($seenByA[$withProposal->id]['media_proposal_pending']);
        $this->assertFalse($seenByA[$withoutProposal->id]['media_proposal_pending']);
        $this->assertArrayNotHasKey('media_proposal_pending', $seenByA[$global->id]);

        $seenByB = $this->listedBy($this->clinicB);
        $this->assertArrayHasKey($withProposal->id, $seenByB);
        foreach ($seenByB as $row) {
            $this->assertArrayNotHasKey('media_proposal_pending', $row);
        }
    }

    private function videoOfA(bool $withProposal): Video
    {
        return Video::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'status'    => Video::STATUS_COMPLETED,
            'metadata'  => $withProposal
                ? ['proposed_thumbnail_path' => 'thumbnails/videos/nova.jpg', 'proposed_at' => now()->toIso8601String(), 'proposed_by_clinic_user_id' => 1]
                : [],
        ]);
    }

    private function exercise(string $name, ?int $clinicId, string $reviewStatus, Video $video): Exercise
    {
        $exercise = Exercise::create([
            'name'           => $name,
            'physio_area_id' => $this->area->id,
            'clinic_id'      => $clinicId,
            'review_status'  => $reviewStatus,
            'is_active'      => true,
        ]);
        $exercise->videos()->attach($video->id);

        return $exercise;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function listedBy(Clinic $clinic): array
    {
        $admin = ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);

        return collect($this->actingAs($admin, 'clinic')
            ->getJson('/api/clinic/exercises?per_page=50')
            ->assertOk()
            ->json('data.data'))
            ->keyBy('id')
            ->all();
    }
}
