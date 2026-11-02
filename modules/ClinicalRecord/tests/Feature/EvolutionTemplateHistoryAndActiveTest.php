<?php

namespace Modules\ClinicalRecord\Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicalRecord\Models\EvolutionTemplate;
use Modules\ClinicalRecord\Models\EvolutionTemplateItem;
use Modules\ClinicalRecord\Models\EvolutionTemplateSection;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class EvolutionTemplateHistoryAndActiveTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinicA;

    private Clinic $clinicB;

    private ClinicUser $adminA;

    private ClinicUser $physioA;

    private ClinicUser $secretaryA;

    private ClinicUser $adminB;

    private Patient $patientA;

    private EvolutionTemplate $systemTemplate;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinicA    = Clinic::factory()->create();
        $this->clinicB    = Clinic::factory()->create();
        $this->adminA     = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->physioA    = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->secretaryA = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $this->adminB     = ClinicUser::factory()->create(['clinic_id' => $this->clinicB->id, 'role' => ClinicUser::ROLE_ADMIN]);

        $this->patientA = Patient::factory()->create([
            'clinic_id'      => $this->clinicA->id,
            'clinic_user_id' => $this->physioA->id,
        ]);

        $this->systemTemplate = EvolutionTemplate::forceCreate([
            'clinic_id'   => null,
            'name'        => 'Template Geral de Fisioterapia',
            'description' => 'Modelo padrão do sistema.',
            'is_system'   => true,
            'is_active'   => true,
        ]);
        $sysSection = EvolutionTemplateSection::forceCreate([
            'evolution_template_id' => $this->systemTemplate->id,
            'title'                 => 'Condutas do sistema',
            'sort_order'            => 0,
        ]);
        EvolutionTemplateItem::forceCreate([
            'evolution_template_section_id' => $sysSection->id,
            'label'                         => 'Alongamento',
            'print_text'                    => 'Alongamento realizado.',
            'has_free_text'                 => false,
            'sort_order'                    => 0,
        ]);
    }

    public function test_editing_a_template_used_in_a_signed_evolution_preserves_its_checked_items_and_restricts_item_deletion(): void
    {
        [$template, $section, $item1, $item2] = $this->createClinicTemplateWithTwoItems($this->clinicA->id);

        $evolutionId = $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/evolutions", [
                'title'                 => 'Sessão 1',
                'evolution_template_id' => $template->id,
                'checked_item_ids'      => [$item1->id, $item2->id],
                'free_text_values'      => [
                    ['item_id' => $item1->id, 'value' => '15 minutos'],
                ],
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/evolutions/{$evolutionId}/sign")
            ->assertOk();

        $this->actingAs($this->physioA, 'clinic')
            ->putJson("/api/clinic/evolution-templates/{$template->id}", [
                'name'        => 'Pós-operatório atualizado',
                'description' => 'Descrição nova',
                'sections'    => [
                    [
                        'id'         => $section->id,
                        'title'      => 'Condutas atualizadas',
                        'sort_order' => 0,
                        'items'      => [
                            [
                                'id'                    => $item1->id,
                                'label'                 => 'Bicicleta ergométrica',
                                'print_text'            => 'Bicicleta sem carga',
                                'has_free_text'         => true,
                                'free_text_placeholder' => 'minutos',
                                'sort_order'            => 0,
                            ],
                            [
                                'id'            => $item2->id,
                                'label'         => 'Crioterapia',
                                'print_text'    => 'Crioterapia por 20 minutos.',
                                'has_free_text' => false,
                                'sort_order'    => 1,
                            ],
                            [
                                'label'         => 'Mobilização patelar',
                                'print_text'    => 'Mobilização patelar realizada.',
                                'has_free_text' => false,
                                'sort_order'    => 2,
                            ],
                        ],
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Pós-operatório atualizado')
            ->assertJsonPath('data.sections.0.id', $section->id)
            ->assertJsonPath('data.sections.0.items.0.id', $item1->id)
            ->assertJsonPath('data.sections.0.items.0.label', 'Bicicleta ergométrica')
            ->assertJsonCount(3, 'data.sections.0.items');

        $this->assertDatabaseHas('clinic_patient_evolution_checked_items', [
            'patient_evolution_id'       => $evolutionId,
            'evolution_template_item_id' => $item1->id,
            'free_text_value'            => '15 minutos',
        ]);
        $this->assertDatabaseHas('clinic_patient_evolution_checked_items', [
            'patient_evolution_id'       => $evolutionId,
            'evolution_template_item_id' => $item2->id,
        ]);

        // A FK restrictOnDelete impede que uma tentativa direta de apagar o item apague o histórico.
        $this->expectException(QueryException::class);
        EvolutionTemplateItem::query()->whereKey($item1->id)->delete();
    }

    public function test_removing_an_item_archives_it_hides_it_from_new_evolutions_and_keeps_it_in_old_evolution(): void
    {
        [$template, $section, $item1, $item2] = $this->createClinicTemplateWithTwoItems($this->clinicA->id);

        $oldEvolutionId = $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/evolutions", [
                'title'                 => 'Sessão antiga',
                'evolution_template_id' => $template->id,
                'checked_item_ids'      => [$item1->id, $item2->id],
                'free_text_values'      => [
                    ['item_id' => $item1->id, 'value' => '10 minutos'],
                ],
            ])
            ->assertCreated()
            ->json('data.id');

        // Edita o modelo mantendo apenas item1 (item2 sai do payload -> deve ser arquivado).
        $this->actingAs($this->physioA, 'clinic')
            ->putJson("/api/clinic/evolution-templates/{$template->id}", [
                'name'        => $template->name,
                'description' => $template->description,
                'sections'    => [
                    [
                        'id'         => $section->id,
                        'title'      => $section->title,
                        'sort_order' => 0,
                        'items'      => [
                            [
                                'id'                    => $item1->id,
                                'label'                 => $item1->label,
                                'print_text'            => $item1->print_text,
                                'has_free_text'         => true,
                                'free_text_placeholder' => 'minutos',
                                'sort_order'            => 0,
                            ],
                        ],
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonCount(1, 'data.sections.0.items')
            ->assertJsonPath('data.sections.0.items.0.id', $item1->id);

        $this->assertNotNull($item2->fresh()->archived_at);
        $this->assertNull($item1->fresh()->archived_at);

        // GET da lista e do detalhe do modelo para novas evoluções não devolvem o item arquivado.
        $this->actingAs($this->physioA, 'clinic')
            ->getJson("/api/clinic/evolution-templates/{$template->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.sections.0.items')
            ->assertJsonPath('data.sections.0.items.0.id', $item1->id);

        // Nova evolução não aceita marcar o item arquivado.
        $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/evolutions", [
                'title'                 => 'Sessão nova com item arquivado',
                'evolution_template_id' => $template->id,
                'checked_item_ids'      => [$item2->id],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['checked_item_ids.0']);

        // Evolução antiga continua mostrando os 2 itens marcados (inclusive o arquivado).
        $oldCheckedIds = collect(
            $this->actingAs($this->physioA, 'clinic')
                ->getJson("/api/clinic/evolutions/{$oldEvolutionId}")
                ->assertOk()
                ->json('data.checked_items')
        )->pluck('evolution_template_item_id')->all();

        $this->assertEqualsCanonicalizing([$item1->id, $item2->id], $oldCheckedIds);
    }

    public function test_section_or_item_id_from_another_template_or_another_clinic_returns_422(): void
    {
        [$templateA1, $sectionA1, $itemA1] = $this->createClinicTemplateWithTwoItems($this->clinicA->id);
        [$templateA2, $sectionA2, $itemA2] = $this->createClinicTemplateWithTwoItems($this->clinicA->id);
        [$templateB, $sectionB, $itemB]    = $this->createClinicTemplateWithTwoItems($this->clinicB->id);

        // Item de outro modelo da mesma clínica → 422
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/evolution-templates/{$templateA1->id}", [
                'name'     => 'Tentativa item outro modelo',
                'sections' => [[
                    'id'         => $sectionA1->id,
                    'title'      => 'Condutas',
                    'sort_order' => 0,
                    'items'      => [[
                        'id'         => $itemA2->id,
                        'label'      => 'Invasão',
                        'print_text' => 'Invasão',
                        'sort_order' => 0,
                    ]],
                ]],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['sections.0.items.0.id']);

        // Seção de outra clínica → 422
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/evolution-templates/{$templateA1->id}", [
                'name'     => 'Tentativa seção outra clínica',
                'sections' => [[
                    'id'         => $sectionB->id,
                    'title'      => 'Invasão B',
                    'sort_order' => 0,
                    'items'      => [[
                        'label'      => 'Item novo',
                        'print_text' => 'Texto',
                        'sort_order' => 0,
                    ]],
                ]],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['sections.0.id']);

        // Item de outra clínica → 422
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/evolution-templates/{$templateA1->id}", [
                'name'     => 'Tentativa item outra clínica',
                'sections' => [[
                    'id'         => $sectionA1->id,
                    'title'      => 'Condutas',
                    'sort_order' => 0,
                    'items'      => [[
                        'id'         => $itemB->id,
                        'label'      => 'Invasão item B',
                        'print_text' => 'Texto',
                        'sort_order' => 0,
                    ]],
                ]],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['sections.0.items.0.id']);

        $this->assertSame('Condutas', $sectionB->fresh()->title);
        $this->assertSame('Bicicleta', $itemB->fresh()->label);
        $this->assertNull($itemA1->fresh()->archived_at);
    }

    public function test_patch_active_toggles_only_is_active_without_touching_sections_and_returns_404_for_system_or_other_clinic(): void
    {
        [$template, $section, $item1, $item2] = $this->createClinicTemplateWithTwoItems($this->clinicA->id);

        $evolutionId = $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/evolutions", [
                'title'                 => 'Sessão com modelo ativo',
                'evolution_template_id' => $template->id,
                'checked_item_ids'      => [$item1->id],
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($this->physioA, 'clinic')
            ->patchJson("/api/clinic/evolution-templates/{$template->id}/active", [
                'is_active' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.id', $template->id)
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('clinic_evolution_templates', [
            'id'        => $template->id,
            'is_active' => false,
        ]);
        // Seções e itens permanecem com os mesmos IDs e não arquivados, e checked_items intacto.
        $this->assertNull($section->fresh()->archived_at);
        $this->assertNull($item1->fresh()->archived_at);
        $this->assertNull($item2->fresh()->archived_at);
        $this->assertDatabaseHas('clinic_patient_evolution_checked_items', [
            'patient_evolution_id'       => $evolutionId,
            'evolution_template_item_id' => $item1->id,
        ]);

        // Continua na listagem de gerenciamento de modelos com is_active = false.
        $listed = collect(
            $this->actingAs($this->physioA, 'clinic')
                ->getJson('/api/clinic/evolution-templates')
                ->assertOk()
                ->json('data')
        )->firstWhere('id', $template->id);
        $this->assertNotNull($listed);
        $this->assertFalse($listed['is_active']);

        // Nova evolução recusa modelo inativo.
        $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/evolutions", [
                'title'                 => 'Sessão com modelo inativo',
                'evolution_template_id' => $template->id,
                'checked_item_ids'      => [$item1->id],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['evolution_template_id']);

        // Modelo do sistema e de outra clínica respondem 404 no PATCH, PUT e DELETE.
        $this->actingAs($this->adminA, 'clinic')
            ->patchJson("/api/clinic/evolution-templates/{$this->systemTemplate->id}/active", ['is_active' => false])
            ->assertNotFound();
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/evolution-templates/{$this->systemTemplate->id}", [
                'name'     => 'Alterar sistema',
                'sections' => [['title' => 'S', 'sort_order' => 0, 'items' => [['label' => 'I', 'print_text' => 'T', 'sort_order' => 0]]]],
            ])
            ->assertNotFound();
        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/evolution-templates/{$this->systemTemplate->id}")
            ->assertNotFound();

        $this->actingAs($this->adminB, 'clinic')
            ->patchJson("/api/clinic/evolution-templates/{$template->id}/active", ['is_active' => true])
            ->assertNotFound();

        $this->assertTrue($this->systemTemplate->fresh()->is_active);
        $this->assertFalse($template->fresh()->is_active);
    }

    public function test_role_permissions_allow_secretary_only_read_and_admin_or_physio_write_and_only_admin_delete(): void
    {
        [$template, $section, $item1] = $this->createClinicTemplateWithTwoItems($this->clinicA->id);

        // Secretária: lê lista e detalhe, mas recebe 403 em POST, PUT, PATCH active e DELETE.
        $this->actingAs($this->secretaryA, 'clinic')
            ->getJson('/api/clinic/evolution-templates')
            ->assertOk();
        $this->actingAs($this->secretaryA, 'clinic')
            ->getJson("/api/clinic/evolution-templates/{$template->id}")
            ->assertOk();
        $this->actingAs($this->secretaryA, 'clinic')
            ->postJson('/api/clinic/evolution-templates', [
                'name'     => 'Modelo secretária',
                'sections' => [['title' => 'S', 'sort_order' => 0, 'items' => [['label' => 'I', 'print_text' => 'T', 'sort_order' => 0]]]],
            ])
            ->assertForbidden();
        $this->actingAs($this->secretaryA, 'clinic')
            ->putJson("/api/clinic/evolution-templates/{$template->id}", [
                'name'     => 'Editado por secretária',
                'sections' => [[
                    'id'         => $section->id,
                    'title'      => 'Condutas',
                    'sort_order' => 0,
                    'items'      => [['id' => $item1->id, 'label' => 'Bicicleta', 'print_text' => 'Texto', 'sort_order' => 0]],
                ]],
            ])
            ->assertForbidden();
        $this->actingAs($this->secretaryA, 'clinic')
            ->patchJson("/api/clinic/evolution-templates/{$template->id}/active", ['is_active' => false])
            ->assertForbidden();
        $this->actingAs($this->secretaryA, 'clinic')
            ->deleteJson("/api/clinic/evolution-templates/{$template->id}")
            ->assertForbidden();

        // Fisioterapeuta: cria, edita e altera ativo, mas recebe 403 no DELETE.
        $this->actingAs($this->physioA, 'clinic')
            ->deleteJson("/api/clinic/evolution-templates/{$template->id}")
            ->assertForbidden();
    }

    public function test_destroy_hard_deletes_unused_template_and_soft_deletes_used_template_preserving_evolution_history(): void
    {
        [$unused, $unusedSection, $unusedItem]        = $this->createClinicTemplateWithTwoItems($this->clinicA->id);
        [$used, $usedSection, $usedItem1, $usedItem2] = $this->createClinicTemplateWithTwoItems($this->clinicA->id);

        $evolutionId = $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/evolutions", [
                'title'                 => 'Evolução com modelo que será excluído',
                'evolution_template_id' => $used->id,
                'checked_item_ids'      => [$usedItem1->id, $usedItem2->id],
                'free_text_values'      => [['item_id' => $usedItem1->id, 'value' => '20 min']],
            ])
            ->assertCreated()
            ->json('data.id');

        // Nunca usado -> exclusão física de modelo, seções e itens.
        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/evolution-templates/{$unused->id}")
            ->assertOk();
        $this->assertDatabaseMissing('clinic_evolution_templates', ['id' => $unused->id]);
        $this->assertDatabaseMissing('clinic_evolution_template_sections', ['id' => $unusedSection->id]);
        $this->assertDatabaseMissing('clinic_evolution_template_items', ['id' => $unusedItem->id]);

        // Já usado -> soft delete no modelo, mantém seções e itens e continua visível na evolução onde foi usado.
        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/evolution-templates/{$used->id}")
            ->assertOk();
        $this->assertSoftDeleted('clinic_evolution_templates', ['id' => $used->id]);
        $this->assertDatabaseHas('clinic_evolution_template_sections', ['id' => $usedSection->id]);
        $this->assertDatabaseHas('clinic_evolution_template_items', ['id' => $usedItem1->id]);
        $this->assertDatabaseHas('clinic_patient_evolution_checked_items', [
            'patient_evolution_id'       => $evolutionId,
            'evolution_template_item_id' => $usedItem1->id,
            'free_text_value'            => '20 min',
        ]);

        // Sai da listagem de modelos da clínica.
        $listedIds = collect(
            $this->actingAs($this->adminA, 'clinic')
                ->getJson('/api/clinic/evolution-templates')
                ->assertOk()
                ->json('data')
        )->pluck('id')->all();
        $this->assertNotContains($used->id, $listedIds);

        // Continua mostrando o modelo e os itens marcados na evolução onde já foi usado.
        $this->actingAs($this->physioA, 'clinic')
            ->getJson("/api/clinic/evolutions/{$evolutionId}")
            ->assertOk()
            ->assertJsonPath('data.template.id', $used->id)
            ->assertJsonPath('data.template.name', $used->name)
            ->assertJsonCount(2, 'data.checked_items');
    }

    public function test_updating_draft_evolution_allows_already_checked_archived_item_but_rejects_new_archived_or_foreign_item(): void
    {
        [$templateA, $sectionA, $itemA1, $itemA2] = $this->createClinicTemplateWithTwoItems($this->clinicA->id);
        [, , $itemB1]                             = $this->createClinicTemplateWithTwoItems($this->clinicB->id);

        $draftId = $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/evolutions", [
                'title'                 => 'Rascunho sessão',
                'evolution_template_id' => $templateA->id,
                'checked_item_ids'      => [$itemA1->id],
            ])
            ->assertCreated()
            ->json('data.id');

        // Arquiva itemA1 e itemA2 editando o modelo com um item novo.
        $this->actingAs($this->physioA, 'clinic')
            ->putJson("/api/clinic/evolution-templates/{$templateA->id}", [
                'name'     => $templateA->name,
                'sections' => [[
                    'id'         => $sectionA->id,
                    'title'      => $sectionA->title,
                    'sort_order' => 0,
                    'items'      => [[
                        'label'      => 'Item substituto',
                        'print_text' => 'Substituto.',
                        'sort_order' => 0,
                    ]],
                ]],
            ])
            ->assertOk();

        // Reabrir e salvar o rascunho mantendo itemA1 (que já estava marcado nele) funciona.
        $this->actingAs($this->physioA, 'clinic')
            ->putJson("/api/clinic/evolutions/{$draftId}", [
                'title'            => 'Rascunho sessão ajustado',
                'checked_item_ids' => [$itemA1->id],
            ])
            ->assertOk();

        // Tentar marcar itemA2 (arquivado e que não estava no rascunho) ou itemB1 (outra clínica) responde 422.
        $this->actingAs($this->physioA, 'clinic')
            ->putJson("/api/clinic/evolutions/{$draftId}", [
                'title'            => 'Rascunho sessão',
                'checked_item_ids' => [$itemA2->id],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['checked_item_ids.0']);

        $this->actingAs($this->physioA, 'clinic')
            ->putJson("/api/clinic/evolutions/{$draftId}", [
                'title'            => 'Rascunho sessão',
                'checked_item_ids' => [$itemB1->id],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['checked_item_ids.0']);
    }

    /**
     * @return array{0: EvolutionTemplate, 1: EvolutionTemplateSection, 2: EvolutionTemplateItem, 3: EvolutionTemplateItem}
     */
    private function createClinicTemplateWithTwoItems(int $clinicId): array
    {
        $template = EvolutionTemplate::forceCreate([
            'clinic_id'   => $clinicId,
            'name'        => 'Pós-operatório de LCA',
            'description' => 'Protocolo inicial',
            'is_system'   => false,
            'is_active'   => true,
        ]);
        $section = EvolutionTemplateSection::forceCreate([
            'evolution_template_id' => $template->id,
            'title'                 => 'Condutas',
            'sort_order'            => 0,
        ]);
        $item1 = EvolutionTemplateItem::forceCreate([
            'evolution_template_section_id' => $section->id,
            'label'                         => 'Bicicleta',
            'print_text'                    => 'Bicicleta sem carga',
            'has_free_text'                 => true,
            'free_text_placeholder'         => 'minutos',
            'sort_order'                    => 0,
        ]);
        $item2 = EvolutionTemplateItem::forceCreate([
            'evolution_template_section_id' => $section->id,
            'label'                         => 'Crioterapia',
            'print_text'                    => 'Crioterapia por 20 minutos.',
            'has_free_text'                 => false,
            'sort_order'                    => 1,
        ]);

        return [$template, $section, $item1, $item2];
    }
}
