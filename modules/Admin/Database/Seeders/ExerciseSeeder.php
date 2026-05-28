<?php

namespace Modules\Admin\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Models\BodyRegion;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\PhysioSubarea;
use Modules\Media\Models\Video;

class ExerciseSeeder extends Seeder
{
    public function run(): void
    {
        $adminId   = \Modules\Admin\Models\User::first()?->id ?? 1;
        $exercises = [
            // ── Traumato-Ortopédica / Coluna Lombar ──────────────────────────────
            [
                'name'              => 'Ponte Glútea',
                'area'              => 'Traumato-Ortopédica',
                'subarea'           => 'Tratamento de Coluna Vertebral',
                'body_region'       => 'Coluna Lombar',
                'difficulty_level'  => Exercise::DIFFICULTY_EASY,
                'movement_form'     => Exercise::MOVEMENT_FORM_BILATERAL,
                'therapeutic_goal'  => 'Fortalecer glúteo máximo e estabilizar coluna lombar.',
                'description'       => 'Deitado em decúbito dorsal, joelhos flexionados e pés apoiados. Elevar o quadril formando uma linha reta entre joelhos, quadril e ombros.',
                'muscle_group'      => 'Glúteo máximo, isquiotibiais, paravertebrais',
                'movement_type'     => 'Concêntrico/Excêntrico',
                'kinetic_chain'     => 'Fechada',
                'decubitus'         => 'Dorsal',
                'indications'       => 'Lombalgia, fortalecimento de core',
                'contraindications' => 'Dor aguda no joelho',
                'sets'              => 3,
                'repetitions'       => 15,
                'rest_time'         => 60,
                'frequency'         => '3x por semana',
                'video_ids'         => [1],
            ],

            // ── Traumato-Ortopédica / Coluna Lombar ──────────────────────────────
            [
                'name'              => 'Bird Dog',
                'area'              => 'Traumato-Ortopédica',
                'subarea'           => 'Tratamento de Coluna Vertebral',
                'body_region'       => 'Coluna Lombar',
                'difficulty_level'  => Exercise::DIFFICULTY_MEDIUM,
                'movement_form'     => Exercise::MOVEMENT_FORM_ALTERNADO,
                'therapeutic_goal'  => 'Estabilização lombo-pélvica e coordenação motora.',
                'description'       => 'Em posição quadrúpede, estender simultaneamente o braço oposto à perna, mantendo coluna neutra. Alternar os lados.',
                'muscle_group'      => 'Multífidos, glúteo máximo, deltóide posterior',
                'movement_type'     => 'Isométrico/Dinâmico',
                'kinetic_chain'     => 'Aberta',
                'decubitus'         => 'Ventral (quadrúpede)',
                'indications'       => 'Instabilidade lombar, reabilitação pós-fratura',
                'contraindications' => 'Dor aguda na coluna',
                'sets'              => 3,
                'repetitions'       => 10,
                'rest_time'         => 45,
                'frequency'         => '3x por semana',
                'video_ids'         => [2],
            ],

            // ── Traumato-Ortopédica / Coluna Cervical ────────────────────────────
            [
                'name'              => 'Retração Cervical',
                'area'              => 'Traumato-Ortopédica',
                'subarea'           => 'Tratamento de Coluna Vertebral',
                'body_region'       => 'Coluna Cervical',
                'difficulty_level'  => Exercise::DIFFICULTY_EASY,
                'movement_form'     => Exercise::MOVEMENT_FORM_BILATERAL,
                'therapeutic_goal'  => 'Corrigir postura anteriorizada da cabeça e fortalecer flexores profundos do pescoço.',
                'description'       => 'Sentado ou em pé, realizar o movimento de "duplo queixo" empurrando levemente a cabeça para trás sem inclinar. Manter 5 segundos.',
                'muscle_group'      => 'Longo do pescoço, longo da cabeça, escalenos',
                'movement_type'     => 'Isométrico',
                'kinetic_chain'     => 'Aberta',
                'decubitus'         => 'Sentado',
                'indications'       => 'Cervicalgia postural, cefaleia tensional',
                'contraindications' => 'Radiculopatia cervical aguda',
                'sets'              => 3,
                'repetitions'       => 12,
                'rest_time'         => 30,
                'frequency'         => 'Diário',
                'video_ids'         => [1, 2],
            ],

            // ── Esportiva / Joelho ───────────────────────────────────────────────
            [
                'name'              => 'Agachamento Unilateral (Single Leg Squat)',
                'area'              => 'Esportiva',
                'subarea'           => 'Reabilitação de Lesões Ligamentares',
                'body_region'       => 'Joelho',
                'difficulty_level'  => Exercise::DIFFICULTY_HARD,
                'movement_form'     => Exercise::MOVEMENT_FORM_UNILATERAL,
                'therapeutic_goal'  => 'Fortalecer quadríceps e estabilizadores de joelho após reconstrução de LCA.',
                'description'       => 'Em pé sobre uma perna, flexionar o joelho até 60–80° mantendo alinhamento do joelho sobre o 2º pododáctilo. Subir de forma controlada.',
                'muscle_group'      => 'Quadríceps, glúteo médio, isquiotibiais',
                'movement_type'     => 'Concêntrico/Excêntrico',
                'kinetic_chain'     => 'Fechada',
                'decubitus'         => 'Ortostático',
                'indications'       => 'Reabilitação pós-LCA, fortalecimento funcional',
                'contraindications' => 'Dor anterior no joelho acima de 6/10',
                'sets'              => 3,
                'repetitions'       => 8,
                'rest_time'         => 90,
                'frequency'         => '3x por semana',
                'video_ids'         => [2],
            ],

            // ── Gerontologia / Equilíbrio ─────────────────────────────────────────
            [
                'name'              => 'Marcha Estacionária com Elevação de Joelho',
                'area'              => 'Gerontologia',
                'subarea'           => 'Prevenção de Quedas',
                'body_region'       => 'Quadril',
                'difficulty_level'  => Exercise::DIFFICULTY_EASY,
                'movement_form'     => Exercise::MOVEMENT_FORM_ALTERNADO,
                'therapeutic_goal'  => 'Melhorar equilíbrio dinâmico e padrão de marcha em idosos.',
                'description'       => 'Em pé, com apoio de cadeira se necessário, elevar os joelhos alternadamente até a altura do quadril simulando uma caminhada no lugar.',
                'muscle_group'      => 'Iliopsoas, tibial anterior, glúteo médio',
                'movement_type'     => 'Concêntrico',
                'kinetic_chain'     => 'Aberta',
                'decubitus'         => 'Ortostático',
                'indications'       => 'Prevenção de quedas, sarcopenia',
                'contraindications' => 'Vertigem grave, hipotensão ortostática não controlada',
                'sets'              => 2,
                'repetitions'       => 20,
                'rest_time'         => 60,
                'frequency'         => 'Diário',
                'video_ids'         => [1],
            ],

            // ── Neurofuncional / Ombro ───────────────────────────────────────────
            [
                'name'              => 'Pendular de Codman',
                'area'              => 'Neurofuncional',
                'subarea'           => 'Reabilitação Pós-AVC',
                'body_region'       => 'Ombro',
                'difficulty_level'  => Exercise::DIFFICULTY_EASY,
                'movement_form'     => Exercise::MOVEMENT_FORM_UNILATERAL,
                'therapeutic_goal'  => 'Descompressão subacromial e ganho de amplitude de movimento do ombro hemiparético.',
                'description'       => 'Inclinado para frente com apoio no lado contralateral. Deixar o braço acometido pender livremente e realizar movimentos circulares com o peso do próprio membro.',
                'muscle_group'      => 'Manguito rotador, deltóide, trapézio',
                'movement_type'     => 'Passivo/Ativo assistido',
                'kinetic_chain'     => 'Aberta',
                'decubitus'         => 'Ortostático inclinado',
                'indications'       => 'Subluxação glenoumeral pós-AVC, síndrome do impacto',
                'contraindications' => 'Fratura glenoumeral não consolidada',
                'sets'              => 2,
                'repetitions'       => 15,
                'rest_time'         => 30,
                'frequency'         => '2x por dia',
                'video_ids'         => [1, 2],
            ],

            // ── Esportiva / Tornozelo ────────────────────────────────────────────
            [
                'name'              => 'Elevação de Calcâneo (Calf Raise)',
                'area'              => 'Esportiva',
                'subarea'           => 'Retorno ao Esporte',
                'body_region'       => 'Tornozelo',
                'difficulty_level'  => Exercise::DIFFICULTY_MEDIUM,
                'movement_form'     => Exercise::MOVEMENT_FORM_BILATERAL,
                'therapeutic_goal'  => 'Fortalecer tríceps sural e preparar tornozelo para cargas de impacto no retorno esportivo.',
                'description'       => 'Em pé com os pés paralelos, elevar os calcâneos o máximo possível, manter 2 segundos e descer de forma excêntrica controlada em 4 segundos.',
                'muscle_group'      => 'Gastrocnêmio, sóleo',
                'movement_type'     => 'Concêntrico/Excêntrico',
                'kinetic_chain'     => 'Fechada',
                'decubitus'         => 'Ortostático',
                'indications'       => 'Reabilitação de entorse, tendinopatia aquiliana',
                'contraindications' => 'Ruptura total de tendão de Aquiles sem cirurgia',
                'sets'              => 3,
                'repetitions'       => 20,
                'rest_time'         => 60,
                'frequency'         => '3x por semana',
                'video_ids'         => [2],
            ],

            // ── Traumato-Ortopédica / Pilates Clínico / Coluna Torácica ──────────
            [
                'name'              => 'Rotação Torácica em Sedestação',
                'area'              => 'Traumato-Ortopédica',
                'subarea'           => 'Pilates Clínico',
                'body_region'       => 'Coluna Torácica',
                'difficulty_level'  => Exercise::DIFFICULTY_EASY,
                'movement_form'     => Exercise::MOVEMENT_FORM_ALTERNADO,
                'therapeutic_goal'  => 'Aumentar mobilidade torácica e reduzir compensações cervicais e lombares.',
                'description'       => 'Sentado com pés apoiados, braços cruzados sobre o peito. Girar o tronco lentamente para um lado até o limite confortável, retornar e repetir no outro.',
                'muscle_group'      => 'Rotadores torácicos, multífidos, oblíquos',
                'movement_type'     => 'Ativo',
                'kinetic_chain'     => 'Aberta',
                'decubitus'         => 'Sentado',
                'indications'       => 'Hipercifose, rigidez torácica, lombalgia por compensação',
                'contraindications' => 'Fratura vertebral torácica aguda',
                'sets'              => 2,
                'repetitions'       => 10,
                'rest_time'         => 30,
                'frequency'         => 'Diário',
                'video_ids'         => [1],
            ],
        ];

        foreach ($exercises as $data) {
            $area    = PhysioArea::where('name', $data['area'])->first();
            $subarea = $area
                ? PhysioSubarea::where('physio_area_id', $area->id)->where('name', $data['subarea'])->first()
                : null;
            $region  = BodyRegion::where('name', $data['body_region'])->first();

            $exercise = Exercise::updateOrCreate(
                ['name' => $data['name']],
                [
                    'physio_area_id'    => $area?->id,
                    'physio_subarea_id' => $subarea?->id,
                    'body_region_id'    => $region?->id,
                    'created_by'        => $adminId,
                    'therapeutic_goal'  => $data['therapeutic_goal'],
                    'description'       => $data['description'],
                    'difficulty_level'  => $data['difficulty_level'],
                    'muscle_group'      => $data['muscle_group'],
                    'movement_type'     => $data['movement_type'],
                    'movement_form'     => $data['movement_form'],
                    'kinetic_chain'     => $data['kinetic_chain'],
                    'decubitus'         => $data['decubitus'],
                    'indications'       => $data['indications'],
                    'contraindications' => $data['contraindications'],
                    'sets'              => $data['sets'],
                    'repetitions'       => $data['repetitions'],
                    'rest_time'         => $data['rest_time'],
                    'frequency'         => $data['frequency'],
                    'is_active'         => true,
                ]
            );

            $videoIds = collect($data['video_ids'])
                ->filter(fn ($id) => Video::find($id) !== null)
                ->all();

            $exercise->videos()->syncWithoutDetaching($videoIds);
        }
    }
}
