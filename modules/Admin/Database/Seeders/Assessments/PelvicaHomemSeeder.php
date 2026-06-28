<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PelvicaHomemSeeder extends Seeder
{
    public function run(): void
    {
        $template = DB::table('admin_assessment_templates')->insertGetId([
            'name'        => 'Fisioterapia Pélvica: Saúde do Homem',
            'description' => null,
            'is_active'   => true,
            'sort_order'  => 4,
            'created_by'  => null,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // ── Seção 1: Sinais Vitais ────────────────────────────────────────
        $s1 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'Sinais Vitais',
            'sort_order'                   => 1,
            'created_at'                   => now(),
            'updated_at'                   => now(),
        ]);
        $this->insertFieldSimple($s1, 'Frequência cardíaca (FC)', 'text', 1);
        $this->insertFieldSimple($s1, 'Pressão arterial (PA)', 'text', 2);
        $this->insertFieldSimple($s1, 'Saturação de oxigênio (SpO2)', 'text', 3);

        // ── Seção 2: História clínica ─────────────────────────────────────
        $s2 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'História clínica',
            'sort_order'                   => 2,
            'created_at'                   => now(),
            'updated_at'                   => now(),
        ]);
        foreach ([
            'Diagnóstico clínico',
            'Queixa principal (QP)',
            'História da moléstia atual (HMA)',
            'História pregressa (HP)',
            'Doenças concomitantes',
            'Cirurgias',
            'Tratamentos realizados',
        ] as $i => $label) {
            $this->insertFieldSimple($s2, $label, 'textarea', $i + 1);
        }

        // ── Seção 3: Antecedentes e hábitos ──────────────────────────────
        $s3 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'Antecedentes e hábitos',
            'sort_order'                   => 3,
            'created_at'                   => now(),
            'updated_at'                   => now(),
        ]);
        foreach ([
            'Antecedentes e hábitos',
            'Histórico de infecção de urina',
            'Já passou por cirurgia no órgão genital',
            'Você ou alguém da sua família já teve câncer de próstata',
            'Tem filhos (quantos)',
            'Realizou vasectomia',
            'Hábitos de vida e vícios',
        ] as $i => $label) {
            $this->insertFieldSimple($s3, $label, 'textarea', $i + 1);
        }

        // ── Seção 4: História urológica ───────────────────────────────────
        $s4 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'História urológica',
            'sort_order'                   => 4,
            'created_at'                   => now(),
            'updated_at'                   => now(),
        ]);

        $fEnch = $this->insertFieldCheckbox($s4, 'Sintomas urinários (fase de enchimento)', 1);
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

        $fEsv = $this->insertFieldCheckbox($s4, 'Sintomas urinários (fase de esvaziamento)', 2);
        $this->insertOptions($fEsv, [
            'Sem sintomas',
            'Hesitação',
            'Esforço miccional',
            'Interrupção miccional',
            'Disúria (dor ou desconforto durante a micção)',
            'Jato de urina sai mais fino',
            'Gotejamento pós miccional',
            'Infecção do trato urinário (ITU)',
            'Esvaziamento incompleto',
        ]);

        $fEpis = $this->insertFieldCheckbox($s4, 'Episódios de perda de urina', 3);
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

        $fQtd = $this->insertFieldCheckbox($s4, 'Quantidade da perda de urina', 4);
        $this->insertOptions($fQtd, ['Em gotas', 'Em jato', 'Contínua']);

        $this->insertFieldSimple($s4, 'Inicio dos sintomas', 'textarea', 5);
        $this->insertFieldSimple($s4, 'Quantas vezes perde urina durante o dia/noite', 'textarea', 6);

        // ── Seção 5: História sexual ──────────────────────────────────────
        $s5 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'História sexual',
            'sort_order'                   => 5,
            'created_at'                   => now(),
            'updated_at'                   => now(),
        ]);

        $fAtiv = $this->insertFieldCheckbox($s5, 'Atividade sexual', 1);
        $this->insertOptions($fAtiv, ['Ativo', 'Inativo', 'Virgem']);

        $this->insertFieldSimple($s5, 'Uso de preservativo nas relações', 'textarea', 2);
        $this->insertFieldSimple($s5, 'Queixas durante a atividade sexual', 'textarea', 3);
        $this->insertFieldSimple($s5, 'Desejo sexual, excitação e orgasmos', 'textarea', 4);

        $fDisf = $this->insertFieldCheckbox($s5, 'Disfunções sexuais', 5);
        $this->insertOptions($fDisf, [
            'Demora muito para gozar',
            'Goza muito rápido',
            'Sente dor ao gozar',
            'Um ou mais episódios de impotência sexual (broxar)',
            'Disfunção erétil',
        ]);

        $this->insertFieldSimple($s5, 'Infecções sexualmente transmissíveis', 'textarea', 6);

        // ── Seção 6: Exame físico ─────────────────────────────────────────
        $s6 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'Exame físico',
            'sort_order'                   => 6,
            'created_at'                   => now(),
            'updated_at'                   => now(),
        ]);
        $this->insertFieldSimple($s6, 'Inspeção', 'textarea', 1);
        $this->insertFieldSimple($s6, 'Palpação', 'textarea', 2);

        DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s6,
            'label'                       => 'Avaliação da dor',
            'field_type'                  => 'range',
            'required'                    => false,
            'sort_order'                  => 3,
            'config'                      => json_encode(['min' => 0, 'max' => 10, 'min_label' => 'Nenhuma dor', 'max_label' => 'Maior dor imaginável']),
            'created_at'                  => now(),
            'updated_at'                  => now(),
        ]);

        $this->insertFieldSimple($s6, 'Caracterização da dor', 'textarea', 4);
        $this->insertFieldSimple($s6, 'Força muscular do assoalho pélvico', 'textarea', 5);

        // ── Seção 7: Exames complementares ───────────────────────────────
        $s7 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'Exames complementares',
            'sort_order'                   => 7,
            'created_at'                   => now(),
            'updated_at'                   => now(),
        ]);
        $this->insertFieldSimple($s7, 'Exames de imagem (RX, RNM, US) ou outros relevantes', 'textarea', 1);

        // ── Seção 8: Testes especiais ─────────────────────────────────────
        $s8 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'Testes especiais',
            'sort_order'                   => 8,
            'created_at'                   => now(),
            'updated_at'                   => now(),
        ]);
        $this->insertFieldSimple($s8, 'Testes específicos para a região alvo que mostram o comprometimento da função ou estrutura', 'textarea', 1);

        // ── Seção 9: Testes funcionais ────────────────────────────────────
        $s9 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title'                        => 'Testes funcionais',
            'sort_order'                   => 9,
            'created_at'                   => now(),
            'updated_at'                   => now(),
        ]);
        $this->insertFieldSimple($s9, 'Exercícios em forma de teste elaborados para avaliar o desempenho do paciente de forma quantitativa e/ou qualitativa', 'textarea', 1);

        // ── Seções finais ─────────────────────────────────────────────────
        foreach ([
            [10, 'Diagnóstico cinético-funcional', 'Síntese dos principais achados que desviam da normalidade e que permitam identificar, quantificar e qualificar os distúrbios cinético-funcionais sensíveis à abordagem fisioterapêutica'],
            [11, 'Objetivos do tratamento',         'Metas a serem alcançadas durante o tratamento'],
            [12, 'Plano de condutas e tratamento',  'Técnicas utilizadas para alcançar os objetivos'],
        ] as [$order, $title, $label]) {
            $sId = DB::table('admin_assessment_sections')->insertGetId([
                'admin_assessment_template_id' => $template,
                'title'                        => $title,
                'sort_order'                   => $order,
                'created_at'                   => now(),
                'updated_at'                   => now(),
            ]);
            $this->insertFieldSimple($sId, $label, 'textarea', 1);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private function insertFieldSimple(int $sectionId, string $label, string $type, int $order): int
    {
        return DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $sectionId,
            'label'                       => $label,
            'field_type'                  => $type,
            'required'                    => false,
            'sort_order'                  => $order,
            'config'                      => null,
            'created_at'                  => now(),
            'updated_at'                  => now(),
        ]);
    }

    private function insertFieldCheckbox(int $sectionId, string $label, int $order): int
    {
        return DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $sectionId,
            'label'                       => $label,
            'field_type'                  => 'checkbox',
            'required'                    => false,
            'sort_order'                  => $order,
            'config'                      => null,
            'created_at'                  => now(),
            'updated_at'                  => now(),
        ]);
    }

    private function insertOptions(int $fieldId, array $options): void
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
