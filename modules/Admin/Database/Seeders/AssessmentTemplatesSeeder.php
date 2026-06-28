<?php

namespace Modules\Admin\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Database\Seeders\Assessments\AntropometriaSeeder;
use Modules\Admin\Database\Seeders\Assessments\AvaliacaoPadraoSeeder;
use Modules\Admin\Database\Seeders\Assessments\FisioterapiaEsportivaSeeder;
use Modules\Admin\Database\Seeders\Assessments\GerontologiaSeeder;
use Modules\Admin\Database\Seeders\Assessments\MusculoesqueleticaCervicalSeeder;
use Modules\Admin\Database\Seeders\Assessments\MusculoesqueleticaLombarSeeder;
use Modules\Admin\Database\Seeders\Assessments\MusculoesqueleticaSeeder;
use Modules\Admin\Database\Seeders\Assessments\NeurologicaSeeder;
use Modules\Admin\Database\Seeders\Assessments\PelvicaHomemSeeder;
use Modules\Admin\Database\Seeders\Assessments\PelvicaMulherSeeder;
use Modules\Admin\Database\Seeders\Assessments\PilatesSeeder;
use Modules\Admin\Database\Seeders\Assessments\PosturalSeeder;
use Modules\Admin\Database\Seeders\Assessments\RespiratoriaSeeder;

class AssessmentTemplatesSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AntropometriaSeeder::class,
            AvaliacaoPadraoSeeder::class,
            GerontologiaSeeder::class,
            FisioterapiaEsportivaSeeder::class,
            MusculoesqueleticaSeeder::class,
            MusculoesqueleticaCervicalSeeder::class,
            MusculoesqueleticaLombarSeeder::class,
            NeurologicaSeeder::class,
            PelvicaMulherSeeder::class,
            PelvicaHomemSeeder::class,
            RespiratoriaSeeder::class,
            PilatesSeeder::class,
            PosturalSeeder::class,
        ]);
    }
}
