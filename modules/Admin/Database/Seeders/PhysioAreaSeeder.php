<?php

namespace Modules\Admin\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Models\PhysioArea;

class PhysioAreaSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            [
                'name'        => 'Aquática',
                'description' => 'Tratamento em meio aquático para reabilitação e condicionamento.',
            ],
            [
                'name'        => 'Cardiovascular',
                'description' => 'Reabilitação cardíaca e vascular.',
            ],
            [
                'name'        => 'Dermatofuncional',
                'description' => 'Tratamento de disfunções dermatológicas e estéticas.',
            ],
            [
                'name'        => 'Esportiva',
                'description' => 'Prevenção e reabilitação de lesões esportivas.',
            ],
            [
                'name'        => 'Neurofuncional',
                'description' => 'Reabilitação de pacientes com disfunções neurológicas.',
            ],
            [
                'name'        => 'Gerontologia',
                'description' => 'Cuidado e reabilitação de pacientes idosos.',
            ],
            [
                'name'        => 'Respiratória',
                'description' => 'Tratamento de disfunções respiratórias e pulmonares.',
            ],
            [
                'name'        => 'Traumato-Ortopédica',
                'description' => 'Reabilitação de lesões traumáticas e ortopédicas.',
            ],
            [
                'name'        => 'Saúde da Mulher',
                'description' => 'Saúde pélvica, gestação, pós-parto e disfunções uroginecológicas.',
            ],
            [
                'name'        => 'Reumatológica',
                'description' => 'Tratamento de doenças reumáticas e autoimunes.',
            ],
            [
                'name'        => 'Pediátrica',
                'description' => 'Reabilitação e desenvolvimento motor infantil.',
            ],
            [
                'name'        => 'Pilates',
                'description' => 'Método de exercícios para condicionamento físico e mental.',
            ],
        ];

        foreach ($areas as $area) {
            PhysioArea::updateOrCreate(
                ['name' => $area['name']],
                $area
            );
        }
    }
}
