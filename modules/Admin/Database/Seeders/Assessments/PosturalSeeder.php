<?php

namespace Modules\Admin\Database\Seeders\Assessments;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PosturalSeeder extends Seeder
{
    public function run(): void
    {
        $template = DB::table('admin_assessment_templates')->insertGetId([
            'name'        => 'Postural',
            'description' => null,
            'is_active'   => true,
            'sort_order'  => 7,
            'created_by'  => null,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // ── Seção 1: História clínica ─────────────────────────────────────
        $s1 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title' => 'História clínica', 'sort_order' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->f($s1, 'Diagnóstico clínico',             'textarea', 1);
        $this->f($s1, 'Queixa principal (QP)',            'textarea', 2);

        DB::table('admin_assessment_fields')->insertGetId([
            'admin_assessment_section_id' => $s1,
            'label'      => 'Avaliação da intensidade da dor',
            'field_type' => 'range',
            'required'   => false,
            'sort_order' => 3,
            'config'     => json_encode(['min' => 0, 'max' => 10, 'min_label' => 'Nenhuma dor', 'max_label' => 'Maior dor imaginável']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->f($s1, 'Características da dor',           'textarea', 4);
        $this->f($s1, 'História da moléstia atual (HMA)', 'textarea', 5);
        $this->f($s1, 'História pregressa (HP)',          'textarea', 6);

        // ── Seção 2: Inspeção - Vista anterior ───────────────────────────
        $s2 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title' => 'Inspeção - Vista anterior', 'sort_order' => 2,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $fCabeca = $this->cb($s2, 'Cabeça', 1);
        $this->opts($fCabeca, [
            'Alinhada à linha média',
            'Inclinada lateralmente à direita',
            'Inclinada lateralmente à esquerda',
            'Rodada para a direita',
            'Rodada para a esquerda',
        ]);

        $fOmbros = $this->cb($s2, 'Ombros', 2);
        $this->opts($fOmbros, ['Alinhados', 'Direito mais elevado', 'Esquerdo mais elevado']);

        $fClav = $this->cb($s2, 'Clavículas', 3);
        $this->opts($fClav, [
            'Alinhadas',
            'Direita verticalizada',
            'Esquerda verticalizada',
            'Direita horizontalizada',
            'Esquerda horizontalizada',
        ]);

        $fTorax = $this->cb($s2, 'Tórax', 4);
        $this->opts($fTorax, [
            'Normal',
            'Cariniforme (peito de pombo)',
            'Em funil (pectus excavatum)',
            'Em tonel ou barril',
        ]);

        $fBracos = $this->cb($s2, 'Braços', 5);
        $this->opts($fBracos, ['Neutros', 'Pronados', 'Supinados']);

        $fTales = $this->cb($s2, 'Triângulo de Tales', 6);
        $this->opts($fTales, ['Simétricos', 'Diminuído à direita', 'Diminuído à esquerda']);

        $fPelve = $this->cb($s2, 'Pelve', 7);
        $this->opts($fPelve, ['Alinhada', 'EIAS direita mais elevada', 'EIAS esquerda mais elevada']);

        $fJoelhos = $this->cb($s2, 'Joelhos', 8);
        $this->opts($fJoelhos, ['Normal', 'Valgo', 'Varo']);

        $fPes = $this->cb($s2, 'Pés', 9);
        $this->opts($fPes, [
            'Normais',
            'Pronados',
            'Supinados',
            'Arco plantar normal',
            'Arco plantar cavo',
            'Arco plantar plano',
        ]);

        $fHalux = $this->cb($s2, 'Hálux', 10);
        $this->opts($fHalux, ['Normais', 'Direito valgo', 'Esquerdo valgo']);

        // ── Seção 3: Inspeção - Vista lateral ────────────────────────────
        $s3 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title' => 'Inspeção - Vista lateral', 'sort_order' => 3,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $fCabLat = $this->cb($s3, 'Cabeça', 1);
        $this->opts($fCabLat, ['Alinhada', 'Protusa', 'Retraída']);

        $fCervLat = $this->cb($s3, 'Cervical', 2);
        $this->opts($fCervLat, ['Normal', 'Hiperlordose', 'Retificação']);

        $fOmbLat = $this->cb($s3, 'Ombros', 3);
        $this->opts($fOmbLat, ['Normais', 'Protusos', 'Retraídos']);

        $fTorLat = $this->cb($s3, 'Torácica', 4);
        $this->opts($fTorLat, ['Normal', 'Hipercifose', 'Retificação']);

        $fLomLat = $this->cb($s3, 'Lombar', 5);
        $this->opts($fLomLat, ['Normal', 'Hiperlordose', 'Retificada']);

        $fPelvLat = $this->cb($s3, 'Pelve', 6);
        $this->opts($fPelvLat, ['Neutra', 'Anteversão', 'Retroversão']);

        $fJoeLat = $this->cb($s3, 'Joelhos', 7);
        $this->opts($fJoeLat, ['Normal', 'Hiperextensão', 'Genoflexo']);

        // ── Seção 4: Inspeção - Vista posterior ──────────────────────────
        $s4 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title' => 'Inspeção - Vista posterior', 'sort_order' => 4,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $fEscap = $this->cb($s4, 'Escápulas', 1);
        $this->opts($fEscap, ['Normais', 'Aduzidas', 'Abduzidas', 'Elevadas', 'Deprimidas', 'Aladas']);

        $fEspinho = $this->cb($s4, 'Processos espinhosos', 2);
        $this->opts($fEspinho, [
            'Alinhados',
            'Desvio em "C" - convexidade à esquerda',
            'Desvio em "C" - convexidade à direita',
            'Desvio em "S" - convexidade superior à direita',
            'Desvio em "S" - convexidade superior à esquerda',
        ]);

        $fPelvPost = $this->cb($s4, 'Pelve', 3);
        $this->opts($fPelvPost, ['Alinhada', 'EIPS direita mais elevada', 'EIPS esquerda mais elevada']);

        $fPesPost = $this->cb($s4, 'Pés', 4);
        $this->opts($fPesPost, ['Normais', 'Valgos', 'Varos']);

        // ── Seção 5: Observações ──────────────────────────────────────────
        $s5 = DB::table('admin_assessment_sections')->insertGetId([
            'admin_assessment_template_id' => $template,
            'title' => 'Observações', 'sort_order' => 5,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->f($s5, 'Observações', 'textarea', 1);
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
}
