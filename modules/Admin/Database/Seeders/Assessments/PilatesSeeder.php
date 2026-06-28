<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PilatesSeeder extends Seeder
{
    public function run(): void
    {
        $template = DB::table('admin_assessment_templates')->insertGetId([
            'name'        => 'Pilates',
            'description' => null,
            'is_active'   => true,
            'sort_order'  => 6,
            'created_by'  => null,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // ── Seção 1: Sinais Vitais ────────────────────────────────────────
        $s1 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'Sinais Vitais', 'sort_order' => 1,
            'created_at'                   => now(), 'updated_at' => now(),
        ]);
        $this->f($s1, 'Frequência cardíaca (FC)', 'text', 1);
        $this->f($s1, 'Pressão arterial (PA)', 'text', 2);
        $this->f($s1, 'Saturação de oxigênio (SpO2)', 'text', 3);

        // ── Seção 2: História clínica ─────────────────────────────────────
        $s2 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'História clínica', 'sort_order' => 2,
            'created_at'                   => now(), 'updated_at' => now(),
        ]);
        $this->f($s2, 'Diagnóstico clínico', 'textarea', 1);
        $this->f($s2, 'Queixa principal (QP)', 'textarea', 2);

        DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s2,
            'label'                       => 'Avaliação da intensidade da dor',
            'field_type'                  => 'range',
            'required'                    => false,
            'sort_order'                  => 3,
            'config'                      => json_encode(['min' => 0, 'max' => 10, 'min_label' => 'Nenhuma dor', 'max_label' => 'Maior dor imaginável']),
            'created_at'                  => now(),
            'updated_at'                  => now(),
        ]);

        $this->f($s2, 'Características da dor', 'textarea', 4);
        $this->f($s2, 'História da moléstia atual (HMA)', 'textarea', 5);
        $this->f($s2, 'História pregressa (HP)', 'textarea', 6);
        $this->f($s2, 'Hábitos de vida', 'textarea', 7);
        $this->f($s2, 'Tratamentos realizados', 'textarea', 8);

        // ── Seção 3: Exame físico ─────────────────────────────────────────
        $s3 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'Exame físico', 'sort_order' => 3,
            'created_at'                   => now(), 'updated_at' => now(),
        ]);

        $this->f($s3, 'Principais achados da avaliação postural', 'textarea', 1);

        $fMobCol = $this->cb($s3, 'Mobilidade da coluna', 2);
        $this->opts($fMobCol, ['Pouca', 'Média', 'Boa', 'Hipermóvel']);

        $fMobQuad = $this->cb($s3, 'Mobilidade de quadril', 3);
        $this->opts($fMobQuad, ['Pouca', 'Média', 'Boa', 'Hipermóvel']);

        $fAlong = $this->cb($s3, 'Alongamento de cadeia posterior', 4);
        $this->opts($fAlong, ['Pouco', 'Médio', 'Bom']);

        $fMobOmb = $this->cb($s3, 'Mobilidade de ombros', 5);
        $this->opts($fMobOmb, ['Pouca', 'Média', 'Boa', 'Hipermóvel']);

        // ── Seção 4: Objetivos do paciente com o Pilates ──────────────────
        $s4 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'Objetivos do paciente com o Pilates', 'sort_order' => 4,
            'created_at'                   => now(), 'updated_at' => now(),
        ]);
        $this->f($s4, 'Metas a serem alcançadas durante o tratamento', 'textarea', 1);

        // ── Seção 5: Plano de condutas e tratamento ───────────────────────
        $s5 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'Plano de condutas e tratamento', 'sort_order' => 5,
            'created_at'                   => now(), 'updated_at' => now(),
        ]);
        $this->f($s5, 'Técnicas utilizadas para alcançar os objetivos', 'textarea', 1);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private function f(int $sid, string $label, string $type, int $order, ?array $config = null): int
    {
        return DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $sid,
            'label'                       => $label,
            'field_type'                  => $type,
            'required'                    => false,
            'sort_order'                  => $order,
            'config'                      => $config ? json_encode($config) : null,
            'created_at'                  => now(),
            'updated_at'                  => now(),
        ]);
    }

    private function cb(int $sid, string $label, int $order): int
    {
        return $this->f($sid, $label, 'checkbox', $order);
    }

    private function opts(int $fieldId, array $options): void
    {
        foreach ($options as $i => $label) {
            DB::table('admin_assessment_field_options')->insert([
                'admin_assessment_field_id' => $fieldId,
                'label'                     => $label,
                'sort_order'                => $i + 1,
                'created_at'                => now(),
                'updated_at'                => now(),
            ]);
        }
    }
}
