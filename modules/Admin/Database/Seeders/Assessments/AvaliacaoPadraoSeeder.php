<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AvaliacaoPadraoSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $templateId = DB::table('admin_assessment_templates')->insertGetId([
            'name'        => 'Avaliação Padrão',
            'description' => 'Avaliação clínica geral com sinais vitais, medidas antropométricas, exame físico e plano terapêutico.',
            'is_active'   => true,
            'sort_order'  => 2,
            'created_at'  => $now, 'updated_at' => $now,
        ]);

        // ── SEÇÃO 1: História Clínica ───────────────────────────────────────
        $s1 = $this->section($templateId, 'História Clínica', 1, $now);
        $this->field($s1, 'Queixa principal e/ou motivo para atendimento', 'textarea', 1, $now);
        $this->field($s1, 'Diagnóstico(s)', 'textarea', 2, $now);
        $this->field($s1, 'Resumo do diagnóstico', 'textarea', 3, $now);
        $this->field($s1, 'História da doença atual', 'textarea', 4, $now);
        $this->field($s1, 'História da doença pregressa', 'textarea', 5, $now);
        $this->field($s1, 'História Clínica', 'textarea', 6, $now);
        $this->field($s1, 'Tratamentos realizados', 'textarea', 7, $now);
        $this->field($s1, 'Histórico familiar e social', 'textarea', 8, $now);
        $this->field($s1, 'Alergias e intolerâncias', 'textarea', 9, $now);
        $this->field($s1, 'Ocupação', 'text', 10, $now);

        // ── SEÇÃO 2: Sinais Vitais ──────────────────────────────────────────
        $s2 = $this->section($templateId, 'Sinais Vitais', 2, $now);
        $this->field($s2, 'Pressão arterial sistólica (mmHg)', 'number', 1, $now, ['unit' => 'mmHg']);
        $this->field($s2, 'Pressão arterial diastólica (mmHg)', 'number', 2, $now, ['unit' => 'mmHg']);
        $this->field($s2, 'Temperatura corporal (°C)', 'number', 3, $now, ['unit' => '°C']);
        $this->field($s2, 'Frequência cardíaca (Bpm)', 'number', 4, $now, ['unit' => 'bpm']);
        $this->field($s2, 'Frequência respiratória (Rpm)', 'number', 5, $now, ['unit' => 'rpm']);
        $this->field($s2, 'Saturação de oxigênio (SaO₂)', 'number', 6, $now, ['unit' => '%']);
        $this->field($s2, 'Dor (escala 0–10)', 'range', 7, $now, ['min' => 0, 'max' => 10, 'label_min' => 'Nenhuma dor', 'label_max' => 'Dor insuportável']);

        // ── SEÇÃO 3: Medidas Antropométricas ───────────────────────────────
        $s3 = $this->section($templateId, 'Medidas Antropométricas', 3, $now);
        $this->field($s3, 'Peso (Kg)', 'number', 1, $now, ['unit' => 'Kg']);
        $this->field($s3, 'Altura (m)', 'number', 2, $now, ['unit' => 'm']);
        $this->field($s3, 'IMC (índice de massa corpórea)', 'number', 3, $now, ['unit' => 'kg/m²']);
        $this->field($s3, 'Circunferência abdominal (cm)', 'number', 4, $now, ['unit' => 'cm']);
        $this->field($s3, 'Circunferência cefálica (cm)', 'number', 5, $now, ['unit' => 'cm']);

        // ── SEÇÃO 4: Dobras Cutâneas (mm) ──────────────────────────────────
        $s4 = $this->section($templateId, 'Dobras Cutâneas (mm)', 4, $now);
        $dobras = ['Tríceps', 'Bíceps', 'Antebraço', 'Subescapular', 'Axilar média', 'Peitoral', 'Abdominal', 'Suprailíaca', 'Coxa Medial', 'Suprapatelar', 'Panturrilha medial'];
        foreach ($dobras as $i => $d) {
            $this->field($s4, $d, 'number', $i + 1, $now, ['unit' => 'mm']);
        }

        // ── SEÇÃO 5: Exame Físico e Conclusão ──────────────────────────────
        $s5 = $this->section($templateId, 'Exame Físico e Conclusão', 5, $now);
        $this->field($s5, 'Exame físico', 'textarea', 1, $now);
        $this->field($s5, 'Exames complementares', 'textarea', 2, $now);
        $this->field($s5, 'Hipótese diagnóstica', 'textarea', 3, $now);
        $this->field($s5, 'Prognóstico', 'textarea', 4, $now);
        $this->field($s5, 'Plano terapêutico', 'textarea', 5, $now);
        $this->field($s5, 'Observações', 'textarea', 6, $now);
    }

    private function section(int $tplId, string $title, int $order, Carbon $now): int
    {
        return DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $tplId,
            'title'      => $title,
            'sort_order' => $order,
            'created_at' => $now, 'updated_at' => $now,
        ]);
    }

    private function field(int $sId, string $label, string $type, int $order, Carbon $now, array $config = []): int
    {
        return DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $sId,
            'label'      => $label,
            'field_type' => $type,
            'required'   => false,
            'sort_order' => $order,
            'config'     => ! empty($config) ? json_encode($config) : null,
            'created_at' => $now, 'updated_at' => $now,
        ]);
    }

    private function options(int $fId, array $labels, Carbon $now): void
    {
        foreach ($labels as $i => $l) {
            DB::table('admin_assessment_field_options')->insert([
                'admin_assessment_field_id' => $fId,
                'label'      => $l,
                'sort_order' => $i + 1,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }
}
