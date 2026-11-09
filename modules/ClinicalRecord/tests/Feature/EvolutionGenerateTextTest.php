<?php

namespace Modules\ClinicalRecord\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicalRecord\Models\EvolutionTemplate;
use Modules\ClinicalRecord\Models\EvolutionTemplateItem;
use Modules\ClinicalRecord\Models\EvolutionTemplateSection;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class EvolutionGenerateTextTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinicA;

    private Clinic $clinicB;

    private ClinicUser $physioA;

    private Patient $patientA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinicA  = Clinic::factory()->create();
        $this->clinicB  = Clinic::factory()->create();
        $this->physioA  = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->patientA = Patient::factory()->create([
            'clinic_id'      => $this->clinicA->id,
            'clinic_user_id' => $this->physioA->id,
        ]);
    }

    public function test_item_of_private_template_of_another_clinic_returns_422_without_text(): void
    {
        $draftId                      = $this->createDraft();
        [, , $itemB]                  = $this->createTemplate($this->clinicB->id, 'Texto secreto da clínica B.');

        $response = $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/evolutions/{$draftId}/generate-text", [
                'checked_item_ids' => [$itemB->id],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['checked_item_ids.0'])
            ->assertJsonMissingPath('data');
        $this->assertStringNotContainsString('Texto secreto da clínica B.', $response->getContent());
    }

    public function test_item_of_system_template_returns_text(): void
    {
        $draftId           = $this->createDraft();
        [, , $systemItem]  = $this->createTemplate(null, 'Alongamento realizado.', isSystem: true);

        $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/evolutions/{$draftId}/generate-text", [
                'checked_item_ids' => [$systemItem->id],
            ])
            ->assertOk()
            ->assertJsonPath('data.generated_text', "**Condutas:**\nAlongamento realizado.");
    }

    public function test_item_of_own_clinic_template_returns_text(): void
    {
        $draftId     = $this->createDraft();
        [, , $itemA] = $this->createTemplate($this->clinicA->id, 'Bicicleta sem carga.');

        $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/evolutions/{$draftId}/generate-text", [
                'checked_item_ids' => [$itemA->id],
            ])
            ->assertOk()
            ->assertJsonPath('data.generated_text', "**Condutas:**\nBicicleta sem carga.");
    }

    public function test_archived_item_already_checked_in_draft_returns_text(): void
    {
        [$template, , $item] = $this->createTemplate($this->clinicA->id, 'Crioterapia por 20 minutos.');
        $draftId             = $this->createDraft([$item->id], $template->id);
        $item->forceFill(['archived_at' => now()])->save();

        $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/evolutions/{$draftId}/generate-text", [
                'checked_item_ids' => [$item->id],
            ])
            ->assertOk()
            ->assertJsonPath('data.generated_text', "**Condutas:**\nCrioterapia por 20 minutos.");
    }

    public function test_archived_item_not_checked_in_draft_returns_422(): void
    {
        [$template, $section, $checked] = $this->createTemplate($this->clinicA->id, 'Crioterapia por 20 minutos.');
        $archived                       = EvolutionTemplateItem::forceCreate([
            'evolution_template_section_id' => $section->id,
            'label'                         => 'Item arquivado',
            'print_text'                    => 'Texto do item arquivado.',
            'has_free_text'                 => false,
            'sort_order'                    => 1,
        ]);
        $draftId = $this->createDraft([$checked->id], $template->id);
        $archived->forceFill(['archived_at' => now()])->save();

        $response = $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/evolutions/{$draftId}/generate-text", [
                'checked_item_ids' => [$checked->id, $archived->id],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['checked_item_ids.1'])
            ->assertJsonMissingValidationErrors(['checked_item_ids.0']);
        $this->assertStringNotContainsString('Texto do item arquivado.', $response->getContent());
    }

    public function test_malformed_payload_returns_422(): void
    {
        $draftId = $this->createDraft();

        $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/evolutions/{$draftId}/generate-text", [
                'checked_item_ids' => 'abc',
                'free_text_values' => [['value' => 'sem item']],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['checked_item_ids', 'free_text_values.0.item_id']);
    }

    public function test_item_of_inactive_own_clinic_template_returns_422(): void
    {
        $draftId               = $this->createDraft();
        [$template, , $itemA]  = $this->createTemplate($this->clinicA->id, 'Texto de modelo inativo.');
        $template->forceFill(['is_active' => false])->save();

        $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/evolutions/{$draftId}/generate-text", [
                'checked_item_ids' => [$itemA->id],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['checked_item_ids.0']);
    }

    public function test_secretary_or_physio_who_does_not_own_the_evolution_gets_403(): void
    {
        $draftId     = $this->createDraft();
        [, , $itemA] = $this->createTemplate($this->clinicA->id, 'Bicicleta sem carga.');
        $secretary   = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $otherPhysio = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        foreach ([$secretary, $otherPhysio] as $user) {
            $this->actingAs($user, 'clinic')
                ->postJson("/api/clinic/evolutions/{$draftId}/generate-text", [
                    'checked_item_ids' => [$itemA->id],
                ])
                ->assertForbidden();
        }
    }

    private function createDraft(array $checkedItemIds = [], ?int $templateId = null): int
    {
        return $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/evolutions", [
                'title'                 => 'Rascunho',
                'evolution_template_id' => $templateId,
                'checked_item_ids'      => $checkedItemIds,
            ])
            ->assertCreated()
            ->json('data.id');
    }

    /**
     * @return array{0: EvolutionTemplate, 1: EvolutionTemplateSection, 2: EvolutionTemplateItem}
     */
    private function createTemplate(?int $clinicId, string $printText, bool $isSystem = false): array
    {
        $template = EvolutionTemplate::forceCreate([
            'clinic_id' => $clinicId,
            'name'      => 'Modelo',
            'is_system' => $isSystem,
            'is_active' => true,
        ]);
        $section = EvolutionTemplateSection::forceCreate([
            'evolution_template_id' => $template->id,
            'title'                 => 'Condutas',
            'sort_order'            => 0,
        ]);
        $item = EvolutionTemplateItem::forceCreate([
            'evolution_template_section_id' => $section->id,
            'label'                         => 'Conduta',
            'print_text'                    => $printText,
            'has_free_text'                 => false,
            'sort_order'                    => 0,
        ]);

        return [$template, $section, $item];
    }
}
