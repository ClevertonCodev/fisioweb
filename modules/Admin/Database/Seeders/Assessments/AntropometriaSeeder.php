<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AntropometriaSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $templateId = DB::table('admin_assessment_templates')->insertGetId([
            'name'        => 'Antropometria e composição corporal - Avaliação física para Profissionais de Educação Física',
            'description' => 'Avaliação física completa com anamnese, avaliação postural, antropometria e composição corporal.',
            'is_active'   => true,
            'sort_order'  => 1,
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        // ── SEÇÃO 1: ANAMNESE ───────────────────────────────────────────────
        $s1 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $templateId,
            'title'      => 'Anamnese',
            'sort_order' => 1,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $this->field($s1, 'Já pratica atividade física? Qual modalidade? Há quanto tempo?', 'textarea', 1, $now);
        $this->field($s1, 'Objetivo', 'textarea', 2, $now);
        $this->field($s1, 'Frequência de treinos na semana', 'range', 3, $now, ['min' => 0, 'max' => 7]);

        $fProblemas = $this->field($s1, 'Problemas de saúde', 'checkbox_multiple', 4, $now);
        $this->options($fProblemas, [
            'Hipertensão arterial sistêmica (HAS)',
            'Diabetes tipo 1',
            'Diabetes tipo 2',
            'Hipercolesterolemia',
            'Asma',
        ], $now);

        $fEpisodios = $this->field($s1, 'Tem ou já teve episódios de', 'checkbox_multiple', 5, $now);
        $this->options($fEpisodios, ['Desmaio', 'Hipotensão arterial', 'Hipoglicemia', 'Convulsão'], $now);

        $this->field($s1, 'Outras patologias ou problemas de saúde', 'textarea', 6, $now);
        $this->field($s1, 'Queixas de dor', 'textarea', 7, $now);
        $this->field($s1, 'Lesões / cirurgias', 'textarea', 8, $now);
        $this->field($s1, 'Medicamentos', 'textarea', 9, $now);
        $this->field($s1, 'Tabagismo (frequência semanal)', 'range', 10, $now, ['min' => 0, 'max' => 7]);
        $this->field($s1, 'Etilismo (frequência semanal)', 'range', 11, $now, ['min' => 0, 'max' => 7]);
        $this->field($s1, 'Qualidade do sono e horas de sono por dia', 'textarea', 12, $now);

        // ── SEÇÃO 2: AVALIAÇÃO POSTURAL — Vista Anterior ───────────────────
        $s2 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $templateId,
            'title'      => 'Avaliação Postural — Vista Anterior',
            'sort_order' => 2,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $f = $this->field($s2, 'Cabeça', 'checkbox_multiple', 1, $now);
        $this->options($f, ['Alinhada à linha média', 'Inclinada lateralmente à direita', 'Inclinada lateralmente à esquerda', 'Rodada para a direita', 'Rodada para a esquerda'], $now);

        $f = $this->field($s2, 'Ombros', 'checkbox_multiple', 2, $now);
        $this->options($f, ['Alinhados', 'Direito mais elevado', 'Esquerdo mais elevado'], $now);

        $f = $this->field($s2, 'Braços', 'checkbox_multiple', 3, $now);
        $this->options($f, ['Neutros', 'Pronados', 'Supinados', 'Triângulo de Tales simétricos', 'Triângulo de Tales menor à direita', 'Triângulo de Tales menor à esquerda'], $now);

        $f = $this->field($s2, 'Pelve', 'checkbox_multiple', 4, $now);
        $this->options($f, ['Alinhada', 'EIAS direita mais elevada', 'EIAS esquerda mais elevada'], $now);

        $f = $this->field($s2, 'Joelhos', 'checkbox_multiple', 5, $now);
        $this->options($f, ['Normal', 'Valgo', 'Varo'], $now);

        $f = $this->field($s2, 'Pés', 'checkbox_multiple', 6, $now);
        $this->options($f, ['Normais', 'Pronados', 'Supinados', 'Arco plantar normal', 'Arco plantar cavo', 'Arco plantar plano'], $now);

        // ── SEÇÃO 3: AVALIAÇÃO POSTURAL — Vista Lateral ────────────────────
        $s3 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $templateId,
            'title'      => 'Avaliação Postural — Vista Lateral',
            'sort_order' => 3,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $f = $this->field($s3, 'Cabeça', 'checkbox_multiple', 1, $now);
        $this->options($f, ['Alinhada', 'Protusa', 'Retraída'], $now);

        $f = $this->field($s3, 'Cervical', 'checkbox_multiple', 2, $now);
        $this->options($f, ['Normal', 'Hiperlordose', 'Retificação'], $now);

        $f = $this->field($s3, 'Ombros', 'checkbox_multiple', 3, $now);
        $this->options($f, ['Normais', 'Protusos', 'Retraídos'], $now);

        $f = $this->field($s3, 'Torácica', 'checkbox_multiple', 4, $now);
        $this->options($f, ['Normal', 'Hipercifose', 'Retificação'], $now);

        $f = $this->field($s3, 'Lombar', 'checkbox_multiple', 5, $now);
        $this->options($f, ['Normal', 'Hiperlordose', 'Retificação'], $now);

        $f = $this->field($s3, 'Pelve', 'checkbox_multiple', 6, $now);
        $this->options($f, ['Neutra', 'Anteversão', 'Retroversão'], $now);

        $f = $this->field($s3, 'Joelhos', 'checkbox_multiple', 7, $now);
        $this->options($f, ['Normal', 'Hiperextensão', 'Genoflexo'], $now);

        // ── SEÇÃO 4: AVALIAÇÃO POSTURAL — Vista Posterior ──────────────────
        $s4 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $templateId,
            'title'      => 'Avaliação Postural — Vista Posterior',
            'sort_order' => 4,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $f = $this->field($s4, 'Escápulas', 'checkbox_multiple', 1, $now);
        $this->options($f, ['Normais', 'Aduzidas', 'Abduzidas', 'Elevadas', 'Deprimidas', 'Aladas'], $now);

        $f = $this->field($s4, 'Processos espinhosos', 'checkbox_multiple', 2, $now);
        $this->options($f, [
            'Alinhados',
            'Desvio em "C" - convexidade à esquerda',
            'Desvio em "C" - convexidade à direita',
            'Desvio em "S" - convexidade superior à direita',
            'Desvio em "S" - convexidade superior à esquerda',
        ], $now);

        $f = $this->field($s4, 'Pelve', 'checkbox_multiple', 3, $now);
        $this->options($f, ['Alinhada', 'EIPS direita mais elevada', 'EIPS esquerda mais elevada'], $now);

        $f = $this->field($s4, 'Pés', 'checkbox_multiple', 4, $now);
        $this->options($f, ['Normais', 'Valgos', 'Varos'], $now);

        // ── SEÇÃO 5: ANTROPOMETRIA — Medidas ───────────────────────────────
        $s5 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $templateId,
            'title'      => 'Antropometria — Medidas',
            'sort_order' => 5,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $this->field($s5, 'Estatura (m)', 'number', 1, $now, ['unit' => 'm']);
        $this->field($s5, 'Massa corporal (Kg)', 'number', 2, $now, ['unit' => 'Kg']);
        $this->field($s5, 'Índice de massa corpórea (IMC)', 'number', 3, $now, ['unit' => 'kg/m²']);

        // ── SEÇÃO 6: ANTROPOMETRIA — Dobras Cutâneas ───────────────────────
        $s6 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $templateId,
            'title'      => 'Antropometria — Dobras Cutâneas',
            'sort_order' => 6,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $dobras = ['Tríceps', 'Subescapular', 'Bíceps', 'Axilar média', 'Torácica ou peitoral', 'Supra-ilíaca', 'Abdominal', 'Coxa', 'Panturrilha medial'];
        foreach ($dobras as $i => $d) {
            $this->field($s6, $d, 'number', $i + 1, $now, ['unit' => 'mm']);
        }

        // ── SEÇÃO 7: ANTROPOMETRIA — Perímetros ────────────────────────────
        $s7 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $templateId,
            'title'      => 'Antropometria — Perímetros',
            'sort_order' => 7,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $perimetros = ['Tórax', 'Cintura', 'Abdômen', 'Quadril', 'Coxa direita', 'Coxa esquerda', 'Perna direita', 'Perna esquerda', 'Braço direito', 'Braço esquerdo', 'Antebraço direito', 'Antebraço esquerdo'];
        foreach ($perimetros as $i => $p) {
            $this->field($s7, $p, 'number', $i + 1, $now, ['unit' => 'cm']);
        }

        // ── SEÇÃO 8: COMPOSIÇÃO CORPORAL ───────────────────────────────────
        $s8 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $templateId,
            'title'      => 'Composição Corporal',
            'sort_order' => 8,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $this->field($s8, 'Percentual de gordura (%)', 'number', 1, $now, ['unit' => '%']);
        $this->field($s8, 'Massa magra (Kg)', 'number', 2, $now, ['unit' => 'Kg']);
        $this->field($s8, 'Massa gorda (Kg)', 'number', 3, $now, ['unit' => 'Kg']);
        $this->field($s8, 'Massa muscular (Kg)', 'number', 4, $now, ['unit' => 'Kg']);
        $this->field($s8, 'Massa óssea (Kg)', 'number', 5, $now, ['unit' => 'Kg']);
        $this->field($s8, 'Massa residual (Kg)', 'number', 6, $now, ['unit' => 'Kg']);
        $this->field($s8, 'Taxa metabólica basal', 'number', 7, $now, ['unit' => 'kcal']);
    }

    private function field(int $sectionId, string $label, string $type, int $order, Carbon $now, array $config = []): int
    {
        return DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $sectionId,
            'label'      => $label,
            'field_type' => $type,
            'required'   => false,
            'sort_order' => $order,
            'config'     => ! empty($config) ? json_encode($config) : null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function options(int $fieldId, array $labels, Carbon $now): void
    {
        foreach ($labels as $i => $label) {
            DB::table('admin_assessment_field_options')->insert([
                'admin_assessment_field_id' => $fieldId,
                'label'      => $label,
                'sort_order' => $i + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
