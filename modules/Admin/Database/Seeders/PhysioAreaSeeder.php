<?php

namespace Modules\Admin\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\PhysioSubarea;

class PhysioAreaSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            [
                'name' => 'Fisioterapia Aquática',
                'description' => 'Tratamento em meio aquático para reabilitação e condicionamento.',
            ],
            [
                'name' => 'Fisioterapia Cardiovascular',
                'description' => 'Reabilitação cardíaca e vascular.',
            ],
            [
                'name' => 'Fisioterapia Dermatofuncional',
                'description' => 'Tratamento de disfunções dermatológicas e estéticas.',
            ],
            [
                'name' => 'Fisioterapia Esportiva',
                'description' => 'Prevenção e reabilitação de lesões esportivas.',
            ],
            [
                'name' => 'Fisioterapia Neurofuncional',
                'description' => 'Reabilitação de pacientes com disfunções neurológicas.',
            ],
            [
                'name' => 'Fisioterapia em Gerontologia',
                'description' => 'Cuidado e reabilitação de pacientes idosos.',
            ],
            [
                'name' => 'Fisioterapia Respiratória',
                'description' => 'Tratamento de disfunções respiratórias e pulmonares.',
            ],
            [
                'name' => 'Fisioterapia Traumato-Ortopédica',
                'description' => 'Reabilitação de lesões traumáticas e ortopédicas.',
            ],
            [
                'name' => 'Fisioterapia na Saúde da Mulher',
                'description' => 'Saúde pélvica, gestação, pós-parto e disfunções uroginecológicas.',
            ],
            [
                'name' => 'Fisioterapia Reumatológica',
                'description' => 'Tratamento de doenças reumáticas e autoimunes.',
            ],
            [
                'name' => 'Fisioterapia Pediátrica',
                'description' => 'Reabilitação e desenvolvimento motor infantil.',
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
