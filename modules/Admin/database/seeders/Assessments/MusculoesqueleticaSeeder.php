<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MusculoesqueleticaSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $tpl = DB::table('admin_assessment_templates')->insertGetId([
            'name'        => 'Fisioterapia Musculoesquelética',
            'description' => 'Avaliação fisioterapêutica musculoesquelética geral com exame físico, testes especiais e plano de tratamento.',
            'is_active'   => true, 'sort_order' => 5,
            'created_at'  => $now, 'updated_at' => $now,
        ]);

        // ── Sinais Vitais ──────────────────────────────────────────────────
        $s = $this->section($tpl, 'Sinais Vitais', 1, $now);
        $this->field($s, 'Frequência cardíaca (FC)', 'number', 1, $now, ['unit' => 'bpm']);
        $this->field($s, 'Pressão arterial (PA)', 'text', 2, $now);
        $this->field($s, 'Saturação de oxigênio (SpO2)', 'number', 3, $now, ['unit' => '%']);

        // ── História Clínica ───────────────────────────────────────────────
        $s = $this->section($tpl, 'História Clínica', 2, $now);
        $this->field($s, 'Diagnóstico clínico', 'textarea', 1, $now);
        $this->field($s, 'Queixa principal (QP)', 'textarea', 2, $now);
        $this->field($s, 'Avaliação da intensidade da dor (0–10)', 'range', 3, $now, ['min' => 0, 'max' => 10, 'label_min' => 'Nenhuma dor', 'label_max' => 'Maior dor imaginável']);
        $this->field($s, 'Características da dor', 'textarea', 4, $now);
        $this->field($s, 'História da moléstia atual (HMA)', 'textarea', 5, $now);
        $this->field($s, 'História pregressa (HP)', 'textarea', 6, $now);
        $this->field($s, 'Hábitos de vida', 'textarea', 7, $now);
        $this->field($s, 'Tratamentos realizados', 'textarea', 8, $now);

        // ── Exame Físico ───────────────────────────────────────────────────
        $s = $this->section($tpl, 'Exame Físico', 3, $now);

        $f = $this->field($s, 'Apresentação do paciente', 'checkbox_multiple', 1, $now);
        $this->options($f, ['Deambulando', 'Deambulando em marcha antálgica', 'Deambulando com auxílio / uso de órtese', 'Uso de cadeira de rodas', 'Orientado', 'Desorientado'], $now);

        $this->field($s, 'Palpação', 'textarea', 2, $now);

        $f = $this->field($s, 'Inspeção', 'checkbox_multiple', 3, $now);
        $this->options($f, ['Edema', 'Rubor', 'Aumento de temperatura local', 'Cicatriz', 'Hematoma'], $now);

        $this->field($s, 'Perimetria', 'textarea', 4, $now);
        $this->field($s, 'Amplitude de movimento (ADM)', 'textarea', 5, $now);
        $this->field($s, 'Força muscular', 'textarea', 6, $now);

        // ── Exames Complementares ──────────────────────────────────────────
        $s = $this->section($tpl, 'Exames Complementares', 4, $now);
        $this->field($s, 'Exames de imagem (RX, RNM, US) ou outros relevantes', 'textarea', 1, $now);

        // ── Testes Especiais ───────────────────────────────────────────────
        $s = $this->section($tpl, 'Testes Especiais', 5, $now);
        $this->field($s, 'Testes específicos para a região alvo', 'textarea', 1, $now);

        // ── Testes Funcionais ──────────────────────────────────────────────
        $s = $this->section($tpl, 'Testes Funcionais', 6, $now);
        $this->field($s, 'Testes funcionais de desempenho', 'textarea', 1, $now);

        // ── Diagnóstico e Plano ────────────────────────────────────────────
        $s = $this->section($tpl, 'Diagnóstico e Plano Terapêutico', 7, $now);
        $this->field($s, 'Diagnóstico fisioterapêutico ou cinético-funcional', 'textarea', 1, $now);
        $this->field($s, 'Objetivos do tratamento', 'textarea', 2, $now);
        $this->field($s, 'Plano de condutas e tratamento', 'textarea', 3, $now);
    }

    private function section(int $t, string $title, int $order, Carbon $now): int
    {
        return DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $t, 'title' => $title,
            'sort_order'                   => $order, 'created_at' => $now, 'updated_at' => $now,
        ]);
    }

    private function field(int $s, string $label, string $type, int $order, Carbon $now, array $config = []): int
    {
        return DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s, 'label' => $label,
            'field_type'                  => $type, 'required' => false, 'sort_order' => $order,
            'config'                      => !empty($config) ? json_encode($config) : null,
            'created_at'                  => $now, 'updated_at' => $now,
        ]);
    }

    private function options(int $f, array $labels, Carbon $now): void
    {
        foreach ($labels as $i => $l) {
            DB::table('admin_assessment_field_options')->insert([
                'admin_assessment_field_id' => $f, 'label' => $l,
                'sort_order'                => $i + 1, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }
}
