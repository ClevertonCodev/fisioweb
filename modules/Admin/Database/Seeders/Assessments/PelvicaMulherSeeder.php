<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PelvicaMulherSeeder extends Seeder
{
    public function run(): void
    {
        $template = DB::table('admin_assessment_templates')->insertGetId([
            'name'        => 'Fisioterapia Pélvica: Saúde da Mulher',
            'description' => null,
            'is_active'   => true,
            'sort_order'  => 3,
            'created_by'  => null,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // ── Seção 1: Sinais Vitais ────────────────────────────────────────
        $s1 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Sinais Vitais',
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s1, 'Frequência cardíaca (FC)', 'text', 1);
        $this->insertFieldSimple($s1, 'Pressão arterial (PA)', 'text', 2);
        $this->insertFieldSimple($s1, 'Saturação de oxigênio (SpO2)', 'text', 3);

        // ── Seção 2: História clínica ─────────────────────────────────────
        $s2 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'História clínica',
            'sort_order' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        foreach ([
            'Diagnóstico clínico',
            'Queixa principal (QP)',
            'História da moléstia atual (HMA)',
            'História pregressa (HP)',
            'Hábitos de vida',
            'Doenças concomitantes',
            'Cirurgias',
            'Tratamentos realizados',
        ] as $i => $label) {
            $this->insertFieldSimple($s2, $label, 'textarea', $i + 1);
        }

        // ── Seção 3: História urológica ───────────────────────────────────
        $s3 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'História urológica',
            'sort_order' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $fEnch = $this->insertFieldCheckbox($s3, 'Sintomas urinários (fase de enchimento)', 1);
        $this->insertOptions($fEnch, [
            'Sem sintomas',
            'Incontinência urinária de esforço (IUE)',
            'Incontinência urinária de urgência (IUU)',
            'Incontinência urinária mista (IUM)',
            'Urgência miccional',
            'Enurese noturna (perda de urina durante o sono)',
            'Polaciúra (aumento da frequência de micções)',
            'Noctúria (aumento da frequência noturna de micções)',
            'Oligúria (diminuição do volume de urina)',
        ]);

        $fEsv = $this->insertFieldCheckbox($s3, 'Sintomas urinários (fase de esvaziamento)', 2);
        $this->insertOptions($fEsv, [
            'Sem sintomas',
            'Hesitação',
            'Esforço miccional',
            'Interrupção miccional',
            'Disúria (dor ou desconforto durante a micção)',
            'Gotejamento pós miccional',
            'Infecção do trato urinário (ITU)',
            'Esvaziamento incompleto',
        ]);

        $fEpis = $this->insertFieldCheckbox($s3, 'Episódios de perda de urina', 3);
        $this->insertOptions($fEpis, [
            'Sem perdas',
            'Tosse',
            'Espirro',
            'Agachar',
            'Levantar peso',
            'Caminhando',
            'Subindo escadas',
            'Perda em contato com a água',
        ]);

        $fQtd = $this->insertFieldCheckbox($s3, 'Quantidade da perda de urina', 4);
        $this->insertOptions($fQtd, ['Em gotas', 'Em jato', 'Contínua']);

        $this->insertFieldSimple($s3, 'Inicio dos sintomas', 'textarea', 5);
        $this->insertFieldSimple($s3, 'Quantas vezes perde urina durante o dia/noite', 'textarea', 6);

        // ── Seção 4: História ginecológica ────────────────────────────────
        $s4 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'História ginecológica',
            'sort_order' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $fEstRep = $this->insertFieldCheckbox($s4, 'Estado reprodutivo', 1);
        $this->insertOptions($fEstRep, ['Menacme', 'Climatério', 'Pós-menopausa']);

        $this->insertFieldSimple($s4, 'Menarca', 'text', 2);
        $this->insertFieldSimple($s4, 'Data da última menstruação', 'date', 3);
        $this->insertFieldSimple($s4, 'Reposição hormonal', 'textarea', 4);
        $this->insertFieldSimple($s4, 'Ciclos menstruais', 'textarea', 5);
        $this->insertFieldSimple($s4, 'Sintomas menstruais e pré-menstruais', 'textarea', 6);
        $this->insertFieldSimple($s4, 'Métodos contraceptivos', 'textarea', 7);

        // ── Seção 5: História obstétrica ──────────────────────────────────
        $s5 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'História obstétrica',
            'sort_order' => 5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s5, 'Gestações / Partos / Abortos', 'textarea', 1);
        $this->insertFieldSimple($s5, 'Complicações puerperais', 'textarea', 2);
        $this->insertFieldSimple($s5, 'Complicações ginecológicas', 'textarea', 3);

        // ── Seção 6: História sexual ──────────────────────────────────────
        $s6 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'História sexual',
            'sort_order' => 6,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $fAtiv = $this->insertFieldCheckbox($s6, 'Atividade sexual', 1);
        $this->insertOptions($fAtiv, ['Ativo', 'Inativo', 'Virgem']);

        $this->insertFieldSimple($s6, 'Queixas durante a atividade sexual', 'textarea', 2);
        $this->insertFieldSimple($s6, 'Desejo sexual, excitação e orgasmos', 'textarea', 3);

        $fDisf = $this->insertFieldCheckbox($s6, 'Disfunções sexuais', 4);
        $this->insertOptions($fDisf, [
            'Vaginismo',
            'Dispareunia',
            'Vulvodínea',
            'Perda de urina durante a relação',
            'Perda de flatos durante a relação',
        ]);

        $this->insertFieldSimple($s6, 'Infecções sexualmente transmissíveis', 'textarea', 5);

        // ── Seção 7: Exame físico ─────────────────────────────────────────
        $s7 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Exame físico',
            'sort_order' => 7,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s7, 'Inspeção', 'textarea', 1);
        $this->insertFieldSimple($s7, 'Palpação', 'textarea', 2);

        DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s7,
            'label'      => 'Avaliação da dor',
            'field_type' => 'range',
            'required'   => false,
            'sort_order' => 3,
            'config'     => json_encode(['min' => 0, 'max' => 10, 'min_label' => 'Nenhuma dor', 'max_label' => 'Maior dor imaginável']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->insertFieldSimple($s7, 'Caracterização da dor', 'textarea', 4);
        $this->insertFieldSimple($s7, 'Força muscular do assoalho pélvico', 'textarea', 5);

        // ── Seção 8: Exames complementares ───────────────────────────────
        $s8 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Exames complementares',
            'sort_order' => 8,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s8, 'Exames de imagem (RX, RNM, US) ou outros relevantes', 'textarea', 1);

        // ── Seção 9: Testes especiais ─────────────────────────────────────
        $s9 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Testes especiais',
            'sort_order' => 9,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s9, 'Testes específicos para a região alvo que mostram o comprometimento da função ou estrutura', 'textarea', 1);

        // ── Seção 10: Testes funcionais ───────────────────────────────────
        $s10 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'      => 'Testes funcionais',
            'sort_order' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertFieldSimple($s10, 'Exercícios em forma de teste elaborados para avaliar o desempenho do paciente de forma quantitativa e/ou qualitativa', 'textarea', 1);

        // ── Seções finais ─────────────────────────────────────────────────
        foreach ([
            [11, 'Diagnóstico cinético-funcional', 'Síntese dos principais achados que desviam da normalidade e que permitam identificar, quantificar e qualificar os distúrbios cinético-funcionais sensíveis à abordagem fisioterapêutica'],
            [12, 'Objetivos do tratamento',         'Metas a serem alcançadas durante o tratamento'],
            [13, 'Plano de condutas e tratamento',  'Técnicas utilizadas para alcançar os objetivos'],
        ] as [$order, $title, $label]) {
            $sId = DB::table('admin_assessment_sections')->insertGetId([
                'admin_assessment_template_id' => $template,
                'title'      => $title,
                'sort_order' => $order,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->insertFieldSimple($sId, $label, 'textarea', 1);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

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
