<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GerontologiaSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $tpl = DB::table('admin_assessment_templates')->insertGetId([
            'name' => 'Fisioterapia em Gerontologia',
            'description' => 'Avaliação fisioterapêutica especializada para pacientes idosos com testes funcionais e cognitivos.',
            'is_active' => true, 'sort_order' => 3,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        // ── Acompanhante ───────────────────────────────────────────────────
        $s = $this->section($tpl, 'Acompanhante', 1, $now);
        $this->field($s, 'Nome do acompanhante', 'text', 1, $now);
        $this->field($s, 'Grau de parentesco / relação', 'text', 2, $now);

        // ── Sinais Vitais ──────────────────────────────────────────────────
        $s = $this->section($tpl, 'Sinais Vitais', 2, $now);
        $this->field($s, 'Frequência cardíaca (FC)', 'number', 1, $now, ['unit' => 'bpm']);
        $this->field($s, 'Pressão arterial (PA)', 'text', 2, $now);
        $this->field($s, 'Saturação de oxigênio (SpO2)', 'number', 3, $now, ['unit' => '%']);

        // ── História Clínica ───────────────────────────────────────────────
        $s = $this->section($tpl, 'História Clínica', 3, $now);
        $this->field($s, 'Diagnóstico clínico', 'textarea', 1, $now);
        $this->field($s, 'Queixa principal (QP)', 'textarea', 2, $now);
        $this->field($s, 'História da moléstia atual (HMA)', 'textarea', 3, $now);
        $this->field($s, 'História pregressa (HP)', 'textarea', 4, $now);
        $this->field($s, 'Presença de dor', 'textarea', 5, $now);
        $this->field($s, 'Medicamentos', 'textarea', 6, $now);
        $this->field($s, 'Doenças concomitantes', 'textarea', 7, $now);
        $this->field($s, 'Hábitos de vida', 'textarea', 8, $now);
        $this->field($s, 'Atividades de vida diária (AVDs) que realiza', 'textarea', 9, $now);
        $this->field($s, 'Tratamentos realizados', 'textarea', 10, $now);

        // ── Exame Físico ───────────────────────────────────────────────────
        $s = $this->section($tpl, 'Exame Físico', 4, $now);

        $f = $this->field($s, 'Apresentação do paciente', 'checkbox_multiple', 1, $now);
        $this->options($f, ['Deambulando', 'Deambulando em marcha antálgica', 'Deambulando com auxílio / uso de órtese', 'Uso de cadeira de rodas'], $now);

        $f = $this->field($s, 'Nível de consciência', 'checkbox_multiple', 2, $now);
        $this->options($f, ['Lúcido-orientado', 'Lúcido com momentos de desorientação', 'Desorientado'], $now);

        $f = $this->field($s, 'Estado emocional', 'checkbox_multiple', 3, $now);
        $this->options($f, ['Calmo', 'Agitado', 'Depressivo', 'Ansioso', 'Agressivo'], $now);

        $this->field($s, 'Palpação', 'textarea', 4, $now);
        $this->field($s, 'Inspeção', 'textarea', 5, $now);
        $this->field($s, 'Contraturas e deformidades', 'textarea', 6, $now);
        $this->field($s, 'Úlceras', 'textarea', 7, $now);
        $this->field($s, 'Amplitude de movimento (ADM)', 'textarea', 8, $now);
        $this->field($s, 'Força muscular', 'textarea', 9, $now);

        // ── Exames Complementares ──────────────────────────────────────────
        $s = $this->section($tpl, 'Exames Complementares', 5, $now);
        $this->field($s, 'Exames de imagem (RX, RNM, US) ou outros relevantes', 'textarea', 1, $now);

        // ── Testes Funcionais ──────────────────────────────────────────────
        $s = $this->section($tpl, 'Testes Funcionais', 6, $now);
        $this->field($s, 'Índice de Barthel', 'textarea', 1, $now);
        $this->field($s, 'Índice de Katz', 'textarea', 2, $now);
        $this->field($s, 'Time Up and Go (TUG)', 'textarea', 3, $now);
        $this->field($s, 'Teste de velocidade da marcha', 'textarea', 4, $now);
        $this->field($s, 'Teste de caminhada de 6 minutos', 'textarea', 5, $now);
        $this->field($s, 'Teste de sentar e levantar', 'textarea', 6, $now);
        $this->field($s, 'Outros testes funcionais', 'textarea', 7, $now);

        // ── Testes Cognitivos ──────────────────────────────────────────────
        $s = $this->section($tpl, 'Testes Cognitivos', 7, $now);
        $this->field($s, 'Mini Exame do Estado Mental (MEEM)', 'textarea', 1, $now);
        $this->field($s, 'Teste Cognitivo de Montreal (MoCA)', 'textarea', 2, $now);
        $this->field($s, 'Escala de Cornell de Depressão em Demência (ECDD)', 'textarea', 3, $now);
        $this->field($s, 'Outros testes cognitivos', 'textarea', 4, $now);

        // ── Diagnóstico e Plano ────────────────────────────────────────────
        $s = $this->section($tpl, 'Diagnóstico e Plano Terapêutico', 8, $now);
        $this->field($s, 'Diagnóstico cinético-funcional', 'textarea', 1, $now);
        $this->field($s, 'Objetivos do tratamento', 'textarea', 2, $now);
        $this->field($s, 'Plano de condutas e tratamento', 'textarea', 3, $now);
    }

    private function section(int $t, string $title, int $order, Carbon $now): int
    {
        return DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $t, 'title' => $title,
            'sort_order' => $order, 'created_at' => $now, 'updated_at' => $now,
        ]);
    }

    private function field(int $s, string $label, string $type, int $order, Carbon $now, array $config = []): int
    {
        return DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s, 'label' => $label,
            'field_type' => $type, 'required' => false, 'sort_order' => $order,
            'config' => !empty($config) ? json_encode($config) : null,
            'created_at' => $now, 'updated_at' => $now,
        ]);
    }

    private function options(int $f, array $labels, Carbon $now): void
    {
        foreach ($labels as $i => $l) {
            DB::table('admin_assessment_field_options')->insert([
                'admin_assessment_field_id' => $f, 'label' => $l,
                'sort_order' => $i + 1, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }
}
