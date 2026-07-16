<?php

namespace Modules\TreatmentProgram\Tests\Unit;

use Modules\Clinic\Models\Clinic;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Services\ProgramPdfViewModelBuilder;
use Tests\TestCase;

class ProgramPdfViewModelBuilderTest extends TestCase
{
    private ProgramPdfViewModelBuilder $builder;

    protected function setUp(): void
    {
        parent::setUp();
        $this->builder = new ProgramPdfViewModelBuilder;
    }

    public function test_group_display_name_falls_back_to_novo_grupo(): void
    {
        $this->assertSame('Novo Grupo', $this->builder->groupDisplayName(null));
        $this->assertSame('Novo Grupo', $this->builder->groupDisplayName(''));
        $this->assertSame('Novo Grupo', $this->builder->groupDisplayName('   '));
        $this->assertSame('Aquecimento', $this->builder->groupDisplayName('Aquecimento'));
    }

    public function test_annotation_months_caps_at_three(): void
    {
        $months = $this->builder->annotationMonths('2026-01-10', '2026-06-20');

        $this->assertCount(3, $months);
        $this->assertSame('2026-01', $months[0]['monthKey']);
        $this->assertSame('2026-02', $months[1]['monthKey']);
        $this->assertSame('2026-03', $months[2]['monthKey']);
        $this->assertStringContainsString('Janeiro', $months[0]['title']);
    }

    public function test_annotation_months_single_month(): void
    {
        $months = $this->builder->annotationMonths('2026-07-10', '2026-07-31');

        $this->assertCount(1, $months);
        $this->assertSame('2026-07', $months[0]['monthKey']);
        $this->assertNotEmpty($months[0]['days']);
        $this->assertSame(10, $months[0]['days'][0]['dayOfMonth']);
    }

    public function test_annotation_months_empty_without_dates(): void
    {
        $this->assertSame([], $this->builder->annotationMonths(null, null));
        $this->assertSame([], $this->builder->annotationMonths('2026-01-01', null));
    }

    public function test_deep_link_requires_patient_and_slug(): void
    {
        $clinic     = new Clinic(['slug' => 'clinica-demo']);
        $clinic->id = 1;

        $plan = new TreatmentPlan([
            'patient_id'   => null,
            'title'        => 'Teste',
            'public_token' => '11111111-2222-3333-4444-555555555555',
        ]);
        $plan->id = 10;
        $plan->setRelation('clinic', $clinic);

        $this->assertNull($this->builder->deepLinkUrl($plan));

        $plan->patient_id = 5;
        config(['app.url' => 'http://localhost:8000']);

        $this->assertSame(
            'http://localhost:8000/clinica-demo/paciente/programas/11111111-2222-3333-4444-555555555555',
            $this->builder->deepLinkUrl($plan)
        );
    }
}
