<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MusculoesqueleticaCervicalSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $tpl = DB::table('admin_assessment_templates')->insertGetId([
            'name' => 'Fisioterapia Musculoesquelética: Cervical',
            'description' => 'Avaliação específica para disfunções da coluna cervical com rastreio de fatores de risco, ADM segmentada e testes neurodinâmicos.',
            'is_active' => true, 'sort_order' => 6,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        // ── História Clínica ───────────────────────────────────────────────
        $s = $this->section($tpl, 'História Clínica', 1, $now);
        $this->field($s, 'Diagnóstico clínico', 'textarea', 1, $now);
        $this->field($s, 'Queixa principal (QP)', 'textarea', 2, $now);
        $this->field($s, 'História da moléstia atual (HMA)', 'textarea', 3, $now);
        $this->field($s, 'História pregressa (HP)', 'textarea', 4, $now);
        $this->field($s, 'Tratamentos realizados', 'textarea', 5, $now);
        $this->field($s, 'Exames complementares', 'textarea', 6, $now);

        // ── Rastreio de Fatores de Risco ───────────────────────────────────
        $s = $this->section($tpl, 'Rastreio de Fatores de Risco', 2, $now);
        $this->field($s, 'Estado da saúde geral / comorbidades', 'textarea', 1, $now);
        $this->field($s, 'Hábitos de vida', 'textarea', 2, $now);
        $this->field($s, 'Emprego ou ocupação', 'text', 3, $now);
        $this->field($s, 'Cirurgias', 'textarea', 4, $now);
        $this->field($s, 'Histórico de câncer', 'textarea', 5, $now);
        $this->field($s, 'Histórico de traumas', 'textarea', 6, $now);
        $this->field($s, 'Qualidade do sono', 'textarea', 7, $now);

        // ── Caracterização dos Sintomas ────────────────────────────────────
        $s = $this->section($tpl, 'Caracterização dos Sintomas', 3, $now);
        $this->field($s, 'Avaliação da intensidade da dor (0–10)', 'range', 1, $now, ['min' => 0, 'max' => 10, 'label_min' => 'Nenhuma dor', 'label_max' => 'Maior dor imaginável']);
        $this->field($s, 'Características da dor', 'textarea', 2, $now);

        $f = $this->field($s, 'Movimentos da coluna cervical que pioram a dor', 'checkbox_multiple', 3, $now);
        $this->options($f, ['Flexão', 'Extensão', 'Inclinação à direita', 'Inclinação à esquerda', 'Rotação à direita', 'Rotação à esquerda'], $now);

        $f = $this->field($s, 'Movimentos da coluna cervical que melhoram a dor', 'checkbox_multiple', 4, $now);
        $this->options($f, ['Flexão', 'Extensão', 'Inclinação à direita', 'Inclinação à esquerda', 'Rotação à direita', 'Rotação à esquerda'], $now);

        $this->field($s, 'Fatores que pioram a dor no dia a dia', 'textarea', 5, $now);
        $this->field($s, 'Fatores que melhoram a dor no dia a dia', 'textarea', 6, $now);
        $this->field($s, 'Há presença de parestesia (formigamentos)?', 'textarea', 7, $now);
        $this->field($s, 'Avaliação da intensidade de parestesia (0–10)', 'range', 8, $now, ['min' => 0, 'max' => 10]);
        $this->field($s, 'Há presença de alteração sensorial (hipoestesia ou hiperestesia)?', 'textarea', 9, $now);
        $this->field($s, 'Avaliação da intensidade da alteração sensorial (0–10)', 'range', 10, $now, ['min' => 0, 'max' => 10]);

        // ── Exame Físico ───────────────────────────────────────────────────
        $s = $this->section($tpl, 'Exame Físico', 4, $now);

        $f = $this->field($s, 'Apresentação do paciente', 'checkbox_multiple', 1, $now);
        $this->options($f, ['Deambulando', 'Deambulando em marcha antálgica', 'Deambulando com auxílio / uso de órtese', 'Uso de cadeira de rodas', 'Orientado', 'Desorientado'], $now);

        $f = $this->field($s, 'Inspeção', 'checkbox_multiple', 2, $now);
        $this->options($f, ['Edema', 'Rubor', 'Aumento de temperatura local', 'Cicatriz', 'Hematoma'], $now);

        $this->field($s, 'Desvios posturais', 'textarea', 3, $now);
        $this->field($s, 'Palpação', 'textarea', 4, $now);

        // ── ADM Cervical ───────────────────────────────────────────────────
        $s = $this->section($tpl, 'Amplitude de Movimento (ADM) Cervical', 5, $now);
        $this->field($s, 'Flexão', 'text', 1, $now, ['unit' => '°']);
        $this->field($s, 'Extensão', 'text', 2, $now, ['unit' => '°']);
        $this->field($s, 'Inclinação para a direita', 'text', 3, $now, ['unit' => '°']);
        $this->field($s, 'Inclinação para a esquerda', 'text', 4, $now, ['unit' => '°']);
        $this->field($s, 'Rotação para a direita', 'text', 5, $now, ['unit' => '°']);
        $this->field($s, 'Rotação para a esquerda', 'text', 6, $now, ['unit' => '°']);

        // ── Força Muscular Cervical ────────────────────────────────────────
        $s = $this->section($tpl, 'Força Muscular Cervical', 6, $now);
        $this->field($s, 'Flexores', 'text', 1, $now);
        $this->field($s, 'Flexores profundos', 'text', 2, $now);
        $this->field($s, 'Extensores', 'text', 3, $now);
        $this->field($s, 'Flexores laterais direitos (inclinação à direita)', 'text', 4, $now);
        $this->field($s, 'Flexores laterais esquerdos (inclinação à esquerda)', 'text', 5, $now);
        $this->field($s, 'Rotadores laterais direitos', 'text', 6, $now);
        $this->field($s, 'Rotadores laterais esquerdos', 'text', 7, $now);

        // ── Testes Especiais ───────────────────────────────────────────────
        $s = $this->section($tpl, 'Testes Especiais', 7, $now);
        $this->field($s, "Spurling's test", 'text', 1, $now);
        $this->field($s, 'Teste de distração cervical', 'text', 2, $now);
        $this->field($s, 'Teste neurodinâmico do nervo mediano', 'text', 3, $now);
        $this->field($s, 'Teste neurodinâmico do nervo ulnar', 'text', 4, $now);
        $this->field($s, 'Teste neurodinâmico do nervo radial', 'text', 5, $now);
        $this->field($s, 'Manobra de Valsalva', 'text', 6, $now);
        $this->field($s, 'Outros testes especiais', 'textarea', 7, $now);

        // ── Diagnóstico e Plano ────────────────────────────────────────────
        $s = $this->section($tpl, 'Diagnóstico e Plano Terapêutico', 8, $now);
        $this->field($s, 'Objetivos / expectativas do paciente', 'textarea', 1, $now);
        $this->field($s, 'Diagnóstico cinético-funcional', 'textarea', 2, $now);
        $this->field($s, 'Objetivos do tratamento', 'textarea', 3, $now);
        $this->field($s, 'Plano de condutas e tratamento', 'textarea', 4, $now);
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
