<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RespiratoriaSeeder extends Seeder
{
    public function run(): void
    {
        $template = DB::table('admin_assessment_templates')->insertGetId([
            'name'        => 'Fisioterapia Respiratória',
            'description' => null,
            'is_active'   => true,
            'sort_order'  => 5,
            'created_by'  => null,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // ── Seção 1: Sinais Vitais ────────────────────────────────────────
        $s1 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title' => 'Sinais Vitais', 'sort_order' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->f($s1, 'Frequência cardíaca (FC)',      'text', 1);
        $this->f($s1, 'Frequência respiratória (FR)',  'text', 2);
        $this->f($s1, 'Pressão arterial (PA)',         'text', 3);
        $this->f($s1, 'Saturação de oxigênio (SpO2)', 'text', 4);

        // ── Seção 2: História clínica ─────────────────────────────────────
        $s2 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title' => 'História clínica', 'sort_order' => 2,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->f($s2, 'Diagnóstico clínico',             'textarea', 1);
        $this->f($s2, 'Queixa principal (QP)',            'textarea', 2);
        $this->f($s2, 'História da moléstia atual (HMA)', 'textarea', 3);
        $this->f($s2, 'História pregressa (HP)',          'textarea', 4);

        $fSint = $this->cb($s2, 'Sinais e sintomas respiratórios', 5);
        $this->opts($fSint, [
            'Tosse produtiva', 'Tosse seca', 'Expectoração viscosa',
            'Expectoração fluídica', 'Hemoptise', 'Ortopneia', 'Dispneia', 'Cianose',
        ]);

        $this->f($s2, 'Hábitos de vida',        'textarea', 6);
        $this->f($s2, 'Tratamentos realizados', 'textarea', 7);

        // ── Seção 3: Exame físico ─────────────────────────────────────────
        $s3 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title' => 'Exame físico', 'sort_order' => 3,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $fResp = $this->cb($s3, 'Respiração', 1);
        $this->opts($fResp, ['Costal', 'Diafragmática', 'Mista', 'Paradoxal', 'Apical']);

        $fDeform = $this->cb($s3, 'Presença de deformidades e anomalias', 2);
        $this->opts($fDeform, [
            'Hipercifose',
            'Escoliose',
            'Gibosidade',
            'Tórax em tonel ou barril',
            'Tórax cariniforme (peito de pombo)',
            'Tórax em funil (pectus excavatum)',
            'Hipocratismo digital',
            'Edema',
            'Hiperativação da musculatura respiratória acessória',
        ]);

        $this->f($s3, 'Ausculta pulmonar',               'textarea', 3);
        $this->f($s3, 'Avaliação muscular respiratória', 'textarea', 4);

        // ── Seção 4: Exames complementares ───────────────────────────────
        $s4 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title' => 'Exames complementares', 'sort_order' => 4,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->f($s4, 'Exames de imagem (RX, RNM, US) ou outros relevantes', 'textarea', 1);

        // ── Seção 5: Testes especiais ─────────────────────────────────────
        $s5 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title' => 'Testes especiais', 'sort_order' => 5,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->f($s5, 'Testes específicos para a região alvo que mostram o comprometimento da função ou estrutura', 'textarea', 1);

        // ── Seção 6: Testes funcionais ────────────────────────────────────
        $s6 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title' => 'Testes funcionais', 'sort_order' => 6,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->f($s6, 'Teste de caminhada de 6 minutos', 'textarea', 1);
        $this->f($s6, 'Teste do degrau',                 'textarea', 2);
        $this->f($s6, 'Teste de sentar e levantar',      'textarea', 3);
        $this->f($s6, 'Outros testes',                   'textarea', 4);

        // ── Seções finais ─────────────────────────────────────────────────
        $this->finalSections($template, 7);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private function f(int $sid, string $label, string $type, int $order, ?array $config = null): int
    {
        return DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $sid,
            'label'      => $label,
            'field_type' => $type,
            'required'   => false,
            'sort_order' => $order,
            'config'     => $config ? json_encode($config) : null,
            'created_at' => now(),
            'updated_at' => now(),
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
                'label'      => $label,
                'sort_order' => $i + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function finalSections(int $template, int $startOrder): void
    {
        foreach ([
            ['Diagnóstico cinético-funcional', 'Síntese dos principais achados que desviam da normalidade e que permitam identificar, quantificar e qualificar os distúrbios cinético-funcionais sensíveis à abordagem fisioterapêutica'],
            ['Objetivos do tratamento',         'Metas a serem alcançadas durante o tratamento'],
            ['Plano de condutas e tratamento',  'Técnicas utilizadas para alcançar os objetivos'],
        ] as $i => [$title, $label]) {
            $sId = DB::table('admin_assessment_sections')->insertGetId([
                'admin_assessment_template_id' => $template,
                'title'      => $title,
                'sort_order' => $startOrder + $i,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->f($sId, $label, 'textarea', 1);
        }
    }
}
