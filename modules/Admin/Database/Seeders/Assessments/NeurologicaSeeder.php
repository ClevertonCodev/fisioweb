<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NeurologicaSeeder extends Seeder
{
    public function run(): void
    {
        $template = DB::table('admin_assessment_templates')->insertGetId([
            'name'        => 'Fisioterapia Neurológica',
            'description' => null,
            'is_active'   => true,
            'sort_order'  => 2,
            'created_by'  => null,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // ── Seção 1: Acompanhante ─────────────────────────────────────────
        $s1 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Acompanhante',
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s1, 'Nome', 'text', 1);
        $this->insertFieldSimple($s1, 'Grau de parentesco/relação', 'text', 2);

        // ── Seção 2: Sinais Vitais ────────────────────────────────────────
        $s2 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Sinais Vitais',
            'sort_order' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s2, 'Frequência cardíaca (FC)', 'text', 1);
        $this->insertFieldSimple($s2, 'Pressão arterial (PA)', 'text', 2);
        $this->insertFieldSimple($s2, 'Saturação de oxigênio (SpO2)', 'text', 3);

        // ── Seção 3: História clínica ─────────────────────────────────────
        $s3 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'História clínica',
            'sort_order' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $clinFields = [
            'Diagnóstico clínico', 'Queixa principal (QP)',
            'História da moléstia atual (HMA)', 'História pregressa (HP)',
            'Presença de dor', 'Doenças concomitantes',
            'Hábitos de vida', 'Tratamentos realizados',
        ];
        foreach ($clinFields as $i => $label) {
            $this->insertFieldSimple($s3, $label, 'textarea', $i + 1);
        }

        // ── Seção 4: Exame físico ─────────────────────────────────────────
        $s4 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Exame físico',
            'sort_order' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $fApres = $this->insertFieldCheckbox($s4, 'Apresentação do paciente', 1);
        $this->insertOptions($fApres, [
            'Deambulando', 'Deambulando em marcha antálgica',
            'Deambulando com auxílio / uso de órtese', 'Uso de cadeira de rodas',
            'Orientado', 'Desorientado',
        ]);

        $this->insertFieldSimple($s4, 'Palpação', 'textarea', 2);

        $fTonus = $this->insertFieldCheckbox($s4, 'Tônus muscular', 3);
        $this->insertOptions($fTonus, ['Normal', 'Hipertonia plástica', 'Hipertonia elástica', 'Hipotonia']);

        $fRefProf = $this->insertFieldCheckbox($s4, 'Reflexos profundos presentes', 4);
        $this->insertOptions($fRefProf, ['Tricipital', 'Bicipital', 'Radial', 'Patelar', 'Aquileu']);

        $fRefSup = $this->insertFieldCheckbox($s4, 'Reflexos superficiais presentes', 5);
        $this->insertOptions($fRefSup, ['Cutâneo palmar', 'Cutâneo abdominal', 'Cutâneo plantar (Babinski)']);

        $this->insertFieldSimple($s4, 'Inspeção', 'textarea', 6);
        $this->insertFieldSimple($s4, 'Contraturas e deformidades', 'textarea', 7);
        $this->insertFieldSimple($s4, 'Úlceras', 'textarea', 8);
        $this->insertFieldSimple($s4, 'Amplitude de movimento (ADM)', 'textarea', 9);
        $this->insertFieldSimple($s4, 'Força muscular', 'textarea', 10);

        // ── Seção 5: Exames complementares ───────────────────────────────
        $s5 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Exames complementares',
            'sort_order' => 5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s5, 'Exames de imagem (RX, RNM, US) ou outros relevantes', 'textarea', 1);

        // ── Seção 6: Testes funcionais ────────────────────────────────────
        $s6 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Testes funcionais',
            'sort_order' => 6,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $testFields = [
            'Time up and go (TUG)', 'Teste de velocidade da marcha',
            'Teste de caminhada de 6 minutos', 'Teste de sentar e levantar', 'Outros testes',
        ];
        foreach ($testFields as $i => $label) {
            $this->insertFieldSimple($s6, $label, 'textarea', $i + 1);
        }

        // ── Seções finais ─────────────────────────────────────────────────
        $this->insertFinalSections($template, 7);
    }

    private function insertFinalSections(int $template, int $startOrder): void
    {
        $sections = [
            ['title' => 'Diagnóstico cinético-funcional', 'label' => 'Síntese dos principais achados que desviam da normalidade e que permitam identificar, quantificar e qualificar os distúrbios cinético-funcionais sensíveis à abordagem fisioterapêutica'],
            ['title' => 'Objetivos do tratamento',        'label' => 'Metas a serem alcançadas durante o tratamento'],
            ['title' => 'Plano de condutas e tratamento', 'label' => 'Técnicas utilizadas para alcançar os objetivos'],
        ];
        foreach ($sections as $i => $sec) {
            $sId = DB::table('admin_assessment_sections')->insertGetId([
                'admin_assessment_template_id' => $template,
                'title'      => $sec['title'],
                'sort_order' => $startOrder + $i,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->insertFieldSimple($sId, $sec['label'], 'textarea', 1);
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

    private function insertFieldCheckbox(int $sectionId, string $label, int $order): int
    {
        return DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $sectionId,
            'label'      => $label,
            'field_type' => 'checkbox',
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
