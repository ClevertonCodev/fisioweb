<?php

namespace Modules\Clinic\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EvolutionTemplateSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('evolution_templates')->where('is_system', true)->exists()) {
            return;
        }

        $templateId = DB::table('evolution_templates')->insertGetId([
            'clinic_id'   => null,
            'name'        => 'Template Geral de Fisioterapia',
            'description' => 'Template padrão do sistema com os procedimentos mais comuns na prática clínica de fisioterapia.',
            'is_system'   => true,
            'is_active'   => true,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // Seção 1 — Anamnese / Avaliação
        $s1 = $this->section($templateId, 'Anamnese / Avaliação', 0);
        $this->item($s1, 'Anamnese inicial realizada', 'Anamnese inicial realizada com levantamento de queixas, histórico clínico e objetivos terapêuticos.', 0);
        $this->item($s1, 'Reavaliação clínica realizada', 'Reavaliação clínica com comparativo ao atendimento anterior.', 1);
        $this->item($s1, 'Escala de dor aplicada (EVA)', 'Avaliação de dor por escala visual analógica (EVA).', 2, true, 'ex: 3/10 antes, 1/10 após');
        $this->item($s1, 'Teste de força muscular realizado', 'Teste de força muscular realizado pelo método manual (escala MRC).', 3, true, 'ex: grau 4 em flexores de joelho');
        $this->item($s1, 'Goniometria realizada', 'Goniometria realizada para avaliação de amplitude de movimento.', 4, true, 'ex: flexão de joelho 90°');

        // Seção 2 — Termoterapia / Eletroterapia
        $s2 = $this->section($templateId, 'Eletroterapia e Termoterapia', 1);
        $this->item($s2, 'TENS realizado nesta sessão', 'Eletroterapia TENS aplicada.', 0, true, 'ex: joelho esquerdo, 80Hz, 200µs, 20 min, analgesia');
        $this->item($s2, 'FES/NMES aplicado nesta sessão', 'Estimulação elétrica neuromuscular (FES/NMES) aplicada.', 1, true, 'ex: quadríceps, 50Hz, 300µs, 20 min');
        $this->item($s2, 'Ultrassom terapêutico aplicado', 'Ultrassom terapêutico aplicado.', 2, true, 'ex: ombro direito, 1MHz, 0,8W/cm², 5 min, pulsado');
        $this->item($s2, 'Calor superficial (hot pack) aplicado', 'Termoterapia com aplicação de calor superficial (hot pack) por 20 minutos.', 3, true, 'ex: lombar, 20 min');
        $this->item($s2, 'Crioterapia aplicada', 'Crioterapia aplicada para controle de dor e edema.', 4, true, 'ex: joelho, 15 min');
        $this->item($s2, 'Laser de baixa intensidade aplicado', 'Laserterapia de baixa intensidade aplicada.', 5, true, 'ex: cicatriz, 3J/cm², pontual, 3 min');

        // Seção 3 — Terapia Manual
        $s3 = $this->section($templateId, 'Terapia Manual', 2);
        $this->item($s3, 'Massoterapia realizada', 'Massoterapia com técnicas de relaxamento muscular e liberação miofascial.', 0, true, 'ex: região lombar e paravertebrais');
        $this->item($s3, 'Mobilização articular realizada', 'Mobilização articular realizada com graduação terapêutica conforme avaliação.', 1, true, 'ex: articulação glenoumeral, grau III');
        $this->item($s3, 'Manipulação vertebral realizada', 'Manipulação vertebral de alta velocidade e baixa amplitude realizada.', 2, true, 'ex: segmento L4-L5');
        $this->item($s3, 'Liberação miofascial realizada', 'Técnica de liberação miofascial aplicada.', 3, true, 'ex: fáscia toracolombar, 10 min');
        $this->item($s3, 'Pompage realizada', 'Técnica de pompage aplicada para descompressão articular e relaxamento muscular.', 4, true, 'ex: coluna cervical');
        $this->item($s3, 'RPG realizada', 'Reeducação postural global (RPG) realizada nesta sessão.', 5, true, 'ex: cadeia posterior, postura de pé');

        // Seção 4 — Alongamentos
        $s4 = $this->section($templateId, 'Alongamentos', 3);
        $this->item($s4, 'Cadeia posterior da coxa (ischiotibiais)', 'Alongamento de cadeia posterior da coxa por 30 segundos em 3 séries (supino, sentado e em pé).', 0);
        $this->item($s4, 'Quadríceps', 'Alongamento de quadríceps por 40 segundos em decúbito lateral/prono.', 1);
        $this->item($s4, 'Tríceps sural (panturrilha)', 'Alongamento de tríceps sural em posição ortostática por 30 segundos em 3 séries.', 2);
        $this->item($s4, 'Cadeia lateral do tronco', 'Alongamento de cadeia lateral do tronco (latíssimo do dorso e oblíquos) por 30 segundos cada lado.', 3);
        $this->item($s4, 'Peitoral e face anterior do ombro', 'Alongamento de peitoral maior e face anterior do ombro por 30 segundos em 3 séries.', 4);
        $this->item($s4, 'Coluna cervical', 'Alongamento de musculatura cervical nas direções laterais e de rotação por 20 segundos cada posição.', 5);
        $this->item($s4, 'Flexores do quadril (iliopsoas)', 'Alongamento de flexores do quadril em posição de ajoelhado/meio-ajoelhado por 40 segundos.', 6);
        $this->item($s4, 'Adutores do quadril', 'Alongamento de adutores do quadril em posição sentada ou em pé por 30 segundos.', 7);

        // Seção 5 — Fortalecimento / Exercícios
        $s5 = $this->section($templateId, 'Fortalecimento / Exercícios Terapêuticos', 4);
        $this->item($s5, 'Exercícios de estabilização lombar realizados', 'Exercícios de estabilização lombar segmentar realizados (contração do transverso abdominal, multífidos).', 0, true, 'ex: prancha 3x30s, bird-dog 3x10');
        $this->item($s5, 'Exercícios em cadeia cinética fechada realizados', 'Exercícios em cadeia cinética fechada realizados para fortalecimento funcional dos membros inferiores.', 1, true, 'ex: mini agachamento 3x15, leg press 3x12');
        $this->item($s5, 'Exercícios em cadeia cinética aberta realizados', 'Exercícios em cadeia cinética aberta realizados para isolamento muscular.', 2, true, 'ex: extensão de joelho 3x12 com caneleira 2kg');
        $this->item($s5, 'Treino de equilíbrio e propriocepção realizado', 'Treino de equilíbrio e propriocepção realizado com progressão de dificuldade.', 3, true, 'ex: apoio unipodal 3x30s, disco proprioceptivo');
        $this->item($s5, 'Exercícios de ombro/manguito rotador realizados', 'Exercícios de fortalecimento do manguito rotador e estabilizadores escapulares realizados.', 4, true, 'ex: rotação externa 3x15 com theraband');
        $this->item($s5, 'Hidroterapia realizada', 'Sessão de hidroterapia realizada em piscina terapêutica.', 5, true, 'ex: 40 min, caminhada aquática e exercícios de MMII');
        $this->item($s5, 'Treino de marcha realizado', 'Treino de marcha realizado com e sem auxílio de dispositivo de apoio.', 6, true, 'ex: corredor de 20m, 3 percursos, sem bengala');

        // Seção 6 — Respiratória / Neurológica
        $s6 = $this->section($templateId, 'Fisioterapia Respiratória / Neurológica', 5);
        $this->item($s6, 'Fisioterapia respiratória realizada', 'Fisioterapia respiratória realizada com técnicas de desobstrução e expansão pulmonar.', 0, true, 'ex: ELTGOL, drenagem postural, flutter 15 min');
        $this->item($s6, 'Exercícios respiratórios com inspirômetro', 'Exercícios respiratórios com incentivador respiratório (inspirômetro de incentivo).', 1, true, 'ex: 3 séries de 10 inspirações sustentadas');
        $this->item($s6, 'Facilitação neuromuscular proprioceptiva (FNP)', 'Técnicas de facilitação neuromuscular proprioceptiva (FNP) aplicadas.', 2, true, 'ex: membro inferior esquerdo, padrões D1 e D2');
        $this->item($s6, 'Treino de AVDs realizado', 'Treino de atividades de vida diária (AVDs) realizado com foco em independência funcional.', 3, true, 'ex: transferência cama/cadeira, vestir-se');

        // Seção 7 — Orientações / Encerramento
        $s7 = $this->section($templateId, 'Orientações e Encerramento', 6);
        $this->item($s7, 'Orientações domiciliares fornecidas', 'Orientações domiciliares fornecidas ao paciente (exercícios, postura, hábitos de vida).', 0, true, 'ex: alongamento diário, evitar posição sentada prolongada');
        $this->item($s7, 'Paciente orientado sobre progressão do tratamento', 'Paciente orientado sobre a evolução do tratamento e próximas metas terapêuticas.', 1);
        $this->item($s7, 'Paciente apresentou boa tolerância aos procedimentos', 'Paciente apresentou boa tolerância a todos os procedimentos realizados nesta sessão.', 2);
        $this->item($s7, 'Alta da sessão sem intercorrências', 'Paciente recebeu alta da sessão sem intercorrências clínicas.', 3);
    }

    private function section(int $templateId, string $title, int $sortOrder): int
    {
        return DB::table('evolution_template_sections')->insertGetId([
            'evolution_template_id' => $templateId,
            'title'                 => $title,
            'sort_order'            => $sortOrder,
            'created_at'            => now(),
            'updated_at'            => now(),
        ]);
    }

    private function item(
        int $sectionId,
        string $label,
        string $printText,
        int $sortOrder,
        bool $hasFreeText = false,
        ?string $placeholder = null,
    ): void {
        DB::table('evolution_template_items')->insert([
            'evolution_template_section_id' => $sectionId,
            'label'                         => $label,
            'print_text'                    => $printText,
            'has_free_text'                 => $hasFreeText,
            'free_text_placeholder'         => $placeholder,
            'sort_order'                    => $sortOrder,
            'created_at'                    => now(),
            'updated_at'                    => now(),
        ]);
    }
}
