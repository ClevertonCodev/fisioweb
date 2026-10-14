<?php

namespace Modules\ClinicQuestionnaire\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Tests\TestCase;

class QuestionnaireTemplateIsolationTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $adminA;

    private ClinicUser $adminB;

    private QuestionnaireTemplate $templateA;

    protected function setUp(): void
    {
        parent::setUp();

        $clinicA      = Clinic::factory()->create();
        $clinicB      = Clinic::factory()->create();
        $this->adminA = ClinicUser::factory()->create(['clinic_id' => $clinicA->id]);
        $this->adminB = ClinicUser::factory()->create(['clinic_id' => $clinicB->id]);

        $this->templateA = QuestionnaireTemplate::factory()->create([
            'clinic_id' => $clinicA->id,
            'title'     => 'Questionário da clínica A',
        ]);
    }

    public function test_index_does_not_list_templates_of_another_clinic(): void
    {
        $ids = collect($this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/questionnaire-templates')
            ->assertOk()
            ->json('data'))->pluck('id');

        $this->assertNotContains($this->templateA->id, $ids);
    }

    public function test_template_of_another_clinic_cannot_be_read_updated_or_deleted(): void
    {
        $id = $this->templateA->id;

        $this->actingAs($this->adminB, 'clinic')
            ->getJson("/api/clinic/questionnaire-templates/{$id}")
            ->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')
            ->putJson("/api/clinic/questionnaire-templates/{$id}", ['title' => 'Alterado por B'])
            ->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')
            ->deleteJson("/api/clinic/questionnaire-templates/{$id}")
            ->assertNotFound();

        $this->assertDatabaseHas('clinic_questionnaire_templates', [
            'id'         => $id,
            'title'      => 'Questionário da clínica A',
            'deleted_at' => null,
        ]);
    }

    public function test_own_templates_can_be_listed_created_read_updated_and_deleted(): void
    {
        $ids = collect($this->actingAs($this->adminA, 'clinic')
            ->getJson('/api/clinic/questionnaire-templates')
            ->assertOk()
            ->json('data'))->pluck('id');
        $this->assertContains($this->templateA->id, $ids);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson('/api/clinic/questionnaire-templates', [
                'title'    => 'Novo questionário A',
                'sections' => [['title' => 'Seção', 'questions' => [['label' => 'Como está?', 'type' => 'text']]]],
            ])
            ->assertCreated();
        $this->assertDatabaseHas('clinic_questionnaire_templates', ['title' => 'Novo questionário A', 'clinic_id' => $this->adminA->clinic_id]);

        $this->actingAs($this->adminA, 'clinic')
            ->getJson("/api/clinic/questionnaire-templates/{$this->templateA->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $this->templateA->id);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/questionnaire-templates/{$this->templateA->id}", ['title' => 'Editado por A'])
            ->assertOk();
        $this->assertDatabaseHas('clinic_questionnaire_templates', ['id' => $this->templateA->id, 'title' => 'Editado por A']);

        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/questionnaire-templates/{$this->templateA->id}")
            ->assertOk();
        $this->assertSoftDeleted('clinic_questionnaire_templates', ['id' => $this->templateA->id]);
    }
}
