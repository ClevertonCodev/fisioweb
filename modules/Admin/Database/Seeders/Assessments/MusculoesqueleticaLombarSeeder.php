<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MusculoesqueleticaLombarSeeder extends Seeder
{
    public function run(): void
    {
        $template = DB::table('admin_assessment_templates')->insertGetId([
            'name'        => 'Fisioterapia Musculoesquelética: Lombar',
            'description' => null,
            'is_active'   => true,
            'sort_order'  => 1,
            'created_by'  => null,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // ── Seção 1: História clínica ──────────────────────────────────────
        $s1 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'História clínica',
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $fields1 = [
            ['label' => 'Diagnóstico clínico',               'field_type' => 'textarea', 'required' => false, 'sort_order' => 1, 'config' => null],
            ['label' => 'Queixa principal (QP)',              'field_type' => 'textarea', 'required' => false, 'sort_order' => 2, 'config' => null],
            ['label' => 'História da moléstia atual (HMA)',   'field_type' => 'textarea', 'required' => false, 'sort_order' => 3, 'config' => null],
            ['label' => 'História pregressa (HP)',            'field_type' => 'textarea', 'required' => false, 'sort_order' => 4, 'config' => null],
            ['label' => 'Tratamentos realizados',             'field_type' => 'textarea', 'required' => false, 'sort_order' => 5, 'config' => null],
            ['label' => 'Exames complementares',              'field_type' => 'textarea', 'required' => false, 'sort_order' => 6, 'config' => null],
        ];
        $this->insertFields($s1, $fields1);

        // ── Seção 2: Rastreio de fatores de risco ─────────────────────────
        $s2 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Rastreio de fatores de risco',
            'sort_order' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $fields2 = [
            ['label' => 'Estado da saúde geral / comorbidades', 'field_type' => 'textarea', 'required' => false, 'sort_order' => 1, 'config' => null],
            ['label' => 'Hábitos de vida',                      'field_type' => 'textarea', 'required' => false, 'sort_order' => 2, 'config' => null],
            ['label' => 'Emprego ou ocupação',                  'field_type' => 'textarea', 'required' => false, 'sort_order' => 3, 'config' => null],
            ['label' => 'Cirurgias',                            'field_type' => 'textarea', 'required' => false, 'sort_order' => 4, 'config' => null],
            ['label' => 'Histórico de câncer',                  'field_type' => 'textarea', 'required' => false, 'sort_order' => 5, 'config' => null],
            ['label' => 'Histórico de traumas',                 'field_type' => 'textarea', 'required' => false, 'sort_order' => 6, 'config' => null],
            ['label' => 'Qualidade do sono',                    'field_type' => 'textarea', 'required' => false, 'sort_order' => 7, 'config' => null],
        ];
        $this->insertFields($s2, $fields2);

        // ── Seção 3: Caracterização dos sintomas ──────────────────────────
        $s3 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Caracterização dos sintomas',
            'sort_order' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s3,
            'label'      => 'Avaliação da intensidade da dor',
            'field_type' => 'range',
            'required'   => false,
            'sort_order' => 1,
            'config'     => json_encode(['min' => 0, 'max' => 10, 'min_label' => 'Nenhuma dor', 'max_label' => 'Maior dor imaginável']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->insertFieldSimple($s3, 'Características da dor', 'textarea', 2);

        $f3 = DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s3,
            'label'      => 'Movimentos da coluna que pioram a dor',
            'field_type' => 'checkbox',
            'required'   => false,
            'sort_order' => 3,
            'config'     => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertOptions($f3, ['Flexão', 'Extensão', 'Inclinação à direita', 'Inclinação à esquerda', 'Rotação à direita', 'Rotação à esquerda']);

        $f4 = DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s3,
            'label'      => 'Movimentos da coluna que melhoram a dor',
            'field_type' => 'checkbox',
            'required'   => false,
            'sort_order' => 4,
            'config'     => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertOptions($f4, ['Flexão', 'Extensão', 'Inclinação à direita', 'Inclinação à esquerda', 'Rotação à direita', 'Rotação à esquerda']);

        $this->insertFieldSimple($s3, 'Fatores que pioram a dor no dia a dia', 'textarea', 5);
        $this->insertFieldSimple($s3, 'Fatores que melhoram a dor no dia a dia', 'textarea', 6);
        $this->insertFieldSimple($s3, 'Há a presença de formigamentos?', 'textarea', 7);

        DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s3,
            'label'      => 'Avaliação da intensidade do formigamento',
            'field_type' => 'range',
            'required'   => false,
            'sort_order' => 8,
            'config'     => json_encode(['min' => 0, 'max' => 10]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->insertFieldSimple($s3, 'Há a presença de parestesia?', 'textarea', 9);

        DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s3,
            'label'      => 'Avaliação da intensidade da parestesia',
            'field_type' => 'range',
            'required'   => false,
            'sort_order' => 10,
            'config'     => json_encode(['min' => 0, 'max' => 10]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── Seção 4: Exame físico ─────────────────────────────────────────
        $s4 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Exame físico',
            'sort_order' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $fApres = DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s4,
            'label'      => 'Apresentação do paciente',
            'field_type' => 'checkbox',
            'required'   => false,
            'sort_order' => 1,
            'config'     => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertOptions($fApres, [
            'Deambulando',
            'Deambulando em marcha antálgica',
            'Deambulando com auxílio / uso de órtese',
            'Uso de cadeira de rodas',
            'Orientado',
            'Desorientado',
        ]);

        $fInsp = DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s4,
            'label'      => 'Inspeção',
            'field_type' => 'checkbox',
            'required'   => false,
            'sort_order' => 2,
            'config'     => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertOptions($fInsp, ['Edema', 'Rubor', 'Aumento de temperatura local', 'Cicatriz', 'Hematoma']);

        $this->insertFieldSimple($s4, 'Desvios posturais', 'textarea', 3);
        $this->insertFieldSimple($s4, 'Palpação', 'textarea', 4);

        $admFields = [
            'Flexão', 'Extensão', 'Inclinação para a direita',
            'Inclinação para a esquerda', 'Rotação para a direita', 'Rotação para a esquerda',
        ];
        foreach ($admFields as $i => $label) {
            DB::table('admin_assessment_fields')->insert([
                'admin_assessment_section_id' => $s4,
                'label'      => 'Amplitude de movimento (ADM) - ' . $label,
                'field_type' => 'text',
                'required'   => false,
                'sort_order' => 5 + $i,
                'config'     => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // ── Seção 5: Força muscular ───────────────────────────────────────
        $s5 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Força muscular',
            'sort_order' => 5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $forcaFields = [
            'Flexores (porção supra e infra)',
            'Ativação do músculo transverso do abdômen',
            'Extensores',
            'Ativação dos músculos multífidos',
            'Flexores laterais direitos (inclinação à direita)',
            'Flexores laterais esquerdos (inclinação à esquerda)',
            'Rotadores laterais direitos',
            'Rotadores laterais esquerdos',
        ];
        $this->insertFields($s5, array_map(fn($l, $i) => ['label' => $l, 'field_type' => 'textarea', 'required' => false, 'sort_order' => $i + 1, 'config' => null], $forcaFields, array_keys($forcaFields)));

        // ── Seção 6: Testes especiais ─────────────────────────────────────
        $s6 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Testes especiais',
            'sort_order' => 6,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $testFields = [
            'Slump test',
            'Teste de Lasègue',
            'Teste de instabilidade em prono',
            'Manobra de Valsalva',
            'Outros',
        ];
        $this->insertFields($s6, array_map(fn($l, $i) => ['label' => $l, 'field_type' => 'textarea', 'required' => false, 'sort_order' => $i + 1, 'config' => null], $testFields, array_keys($testFields)));

        // ── Seção 7: Objetivos / expectativas do paciente ─────────────────
        $s7 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Objetivos / expectativas do paciente',
            'sort_order' => 7,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s7, 'Expectativas a serem cumpridas ou gerenciadas', 'textarea', 1);

        // ── Seção 8: Diagnóstico cinético-funcional ───────────────────────
        $s8 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Diagnóstico cinético-funcional',
            'sort_order' => 8,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s8, 'Síntese dos principais achados que desviam da normalidade e que permitam identificar, quantificar e qualificar os distúrbios cinético-funcionais sensíveis à abordagem fisioterapêutica', 'textarea', 1);

        // ── Seção 9: Objetivos do tratamento ─────────────────────────────
        $s9 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Objetivos do tratamento',
            'sort_order' => 9,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s9, 'Metas a serem alcançadas durante o tratamento', 'textarea', 1);

        // ── Seção 10: Plano de condutas e tratamento ──────────────────────
        $s10 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Plano de condutas e tratamento',
            'sort_order' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s10, 'Técnicas utilizadas para alcançar os objetivos', 'textarea', 1);
    }

    private function insertFields(int $sectionId, array $fields): void
    {
        foreach ($fields as $field) {
            DB::table('admin_assessment_fields')->insert([
                'admin_assessment_section_id' => $sectionId,
                'label'      => $field['label'],
                'field_type' => $field['field_type'],
                'required'   => $field['required'],
                'sort_order' => $field['sort_order'],
                'config'     => $field['config'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function insertFieldSimple(int $sectionId, string $label, string $type, int $order): int
    {
        return DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $sectionId,
            'label'      => $label,
            'field_type' => $type,
            'required'   => false,
            'sort_order' => $order,
            'config'     => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertOptions(int $fieldId, array $options): void
    {
        foreach ($options as $i => $label) {
            DB::table('admin_assessment_field_options')->insert([
                'admin_assessment_field_id' => $fieldId,
                'label'      => $label,
                'sort_order' => $i + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
