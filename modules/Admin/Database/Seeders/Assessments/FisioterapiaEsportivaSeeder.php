<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FisioterapiaEsportivaSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $tpl = DB::table('admin_assessment_templates')->insertGetId([
            'name' => 'Fisioterapia Esportiva',
            'description' => 'Avaliação fisioterapêutica para atletas com identificação esportiva, dados da lesão e testes funcionais.',
            'is_active' => true, 'sort_order' => 4,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        // ── Identificação do Atleta ────────────────────────────────────────
        $s = $this->section($tpl, 'Identificação do Atleta', 1, $now);
        $this->field($s, 'Modalidade', 'text', 1, $now);
        $this->field($s, 'Posição', 'text', 2, $now);
        $this->field($s, 'Tempo de prática', 'text', 3, $now);

        $f = $this->field($s, 'Dominância de membros superiores', 'checkbox_multiple', 4, $now);
        $this->options($f, ['Destro', 'Canhoto', 'Ambidestro'], $now);

        $f = $this->field($s, 'Dominância de membros inferiores', 'checkbox_multiple', 5, $now);
        $this->options($f, ['Destro', 'Canhoto', 'Ambidestro'], $now);

        // ── Dados da Lesão ─────────────────────────────────────────────────
        $s = $this->section($tpl, 'Dados da Lesão', 2, $now);
        $this->field($s, 'Data da lesão ou início dos sintomas', 'date', 1, $now);

        $f = $this->field($s, 'Situação da ocorrência da lesão ou início dos sintomas', 'checkbox_multiple', 2, $now);
        $this->options($f, ['Treino', 'Jogo', 'Fora da prática esportiva'], $now);

        $f = $this->field($s, 'Característica da lesão', 'checkbox_multiple', 3, $now);
        $this->options($f, ['Em contato com outro atleta', 'Sem contato com outro atleta', 'Sobrecarga ("overuse")'], $now);

        $this->field($s, 'Mecanismo de lesão', 'textarea', 4, $now);

        // ── História Clínica ───────────────────────────────────────────────
        $s = $this->section($tpl, 'História Clínica', 3, $now);
        $this->field($s, 'Diagnóstico clínico', 'textarea', 1, $now);
        $this->field($s, 'Queixa principal (QP)', 'textarea', 2, $now);
        $this->field($s, 'Avaliação da intensidade da dor (0–10)', 'range', 3, $now, ['min' => 0, 'max' => 10, 'label_min' => 'Nenhuma dor', 'label_max' => 'Maior dor imaginável']);
        $this->field($s, 'Características da dor', 'textarea', 4, $now);
        $this->field($s, 'História da moléstia atual (HMA)', 'textarea', 5, $now);
        $this->field($s, 'História pregressa (HP)', 'textarea', 6, $now);
        $this->field($s, 'Hábitos de vida', 'textarea', 7, $now);
        $this->field($s, 'Tratamentos realizados', 'textarea', 8, $now);

        // ── Exame Físico ───────────────────────────────────────────────────
        $s = $this->section($tpl, 'Exame Físico', 4, $now);

        $f = $this->field($s, 'Apresentação do paciente', 'checkbox_multiple', 1, $now);
        $this->options($f, ['Deambulando', 'Deambulando em marcha antálgica', 'Deambulando com auxílio / uso de órtese', 'Uso de cadeira de rodas', 'Orientado', 'Desorientado'], $now);

        $this->field($s, 'Frequência cardíaca (FC)', 'number', 2, $now, ['unit' => 'bpm']);
        $this->field($s, 'Pressão arterial (PA)', 'text', 3, $now);
        $this->field($s, 'Saturação de oxigênio (SpO2)', 'number', 4, $now, ['unit' => '%']);
        $this->field($s, 'Palpação', 'textarea', 5, $now);

        $f = $this->field($s, 'Inspeção', 'checkbox_multiple', 6, $now);
        $this->options($f, ['Edema', 'Rubor', 'Aumento de temperatura local', 'Cicatriz', 'Hematoma'], $now);

        $this->field($s, 'Perimetria', 'textarea', 7, $now);
        $this->field($s, 'Amplitude de movimento (ADM)', 'textarea', 8, $now);
        $this->field($s, 'Força muscular', 'textarea', 9, $now);

        // ── Exames Complementares ──────────────────────────────────────────
        $s = $this->section($tpl, 'Exames Complementares', 5, $now);
        $this->field($s, 'Exames de imagem (RX, RNM, US) ou outros relevantes', 'textarea', 1, $now);

        // ── Testes Especiais ───────────────────────────────────────────────
        $s = $this->section($tpl, 'Testes Especiais', 6, $now);
        $this->field($s, 'Testes específicos para a região alvo', 'textarea', 1, $now);

        // ── Testes Funcionais ──────────────────────────────────────────────
        $s = $this->section($tpl, 'Testes Funcionais', 7, $now);
        $this->field($s, 'Testes funcionais de desempenho', 'textarea', 1, $now);

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
