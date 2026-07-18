<?php

namespace Modules\Admin\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\PhysioSubarea;

class PhysioSubareaSeeder extends Seeder
{
    public function run(): void
    {
        $subareas = [
            'Aquática' => [
                'Hidroterapia',
                'Hidrocinesioterapia',
                'Watsu',
                'Bad Ragaz',
                'Halliwick',
            ],
            'Cardiovascular' => [
                'Reabilitação Cardíaca',
                'Reabilitação Vascular',
                'Reabilitação Pós-Cirurgia Cardíaca',
                'Tratamento de Linfedema',
            ],
            'Dermatofuncional' => [
                'Pré e Pós-Operatório de Cirurgia Plástica',
                'Tratamento de Cicatrizes e Queimaduras',
                'Drenagem Linfática',
                'Eletroterapia Estética',
                'Tratamento de Fibroses',
            ],
            'Esportiva' => [
                'Reabilitação de Lesões Musculares',
                'Reabilitação de Lesões Ligamentares',
                'Prevenção de Lesões',
                'Retorno ao Esporte',
                'Avaliação Funcional do Atleta',
            ],
            'Neurofuncional' => [
                'Reabilitação Pós-AVC',
                'Tratamento de Parkinson',
                'Esclerose Múltipla',
                'Lesão Medular',
                'Paralisia Cerebral',
                'Neuropatias Periféricas',
            ],
            'Gerontologia' => [
                'Prevenção de Quedas',
                'Reabilitação Funcional do Idoso',
                'Tratamento de Sarcopenia',
                'Mobilidade e Equilíbrio',
            ],
            'Respiratória' => [
                'Reabilitação Pulmonar',
                'Ventilação Mecânica',
                'Fisioterapia em UTI',
                'Tratamento de Asma e DPOC',
                'Pré e Pós-Operatório Torácico',
            ],
            'Traumato-Ortopédica' => [
                'Reabilitação Pós-Fratura',
                'Reabilitação Pós-Cirurgia Ortopédica',
                'Tratamento de Coluna Vertebral',
                'Terapia Manual',
                'RPG (Reeducação Postural Global)',
                'Pilates Clínico',
            ],
            'Saúde da Mulher' => [
                'Reabilitação do Assoalho Pélvico',
                'Fisioterapia Obstétrica',
                'Pós-Parto',
                'Tratamento de Incontinência Urinária',
                'Preparação para o Parto',
            ],
            'Reumatológica' => [
                'Artrite Reumatoide',
                'Fibromialgia',
                'Osteoartrose',
                'Espondilite Anquilosante',
                'Lúpus Eritematoso',
            ],
            'Pediátrica' => [
                'Estimulação Precoce',
                'Desenvolvimento Motor',
                'Reabilitação Neurológica Infantil',
                'Fisioterapia Respiratória Pediátrica',
                'Tratamento de Torcicolo Congênito',
            ],
        ];

        foreach ($subareas as $areaName => $names) {
            $area = PhysioArea::where('name', $areaName)->first();

            if (!$area) {
                continue;
            }

            foreach ($names as $name) {
                PhysioSubarea::updateOrCreate(
                    ['physio_area_id' => $area->id, 'name' => $name],
                    ['physio_area_id' => $area->id, 'name' => $name]
                );
            }
        }
    }
}
