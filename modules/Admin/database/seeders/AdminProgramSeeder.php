<?php

namespace Modules\Admin\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Models\AdminProgram;
use Modules\Admin\Models\AdminProgramExercise;
use Modules\Admin\Models\AdminProgramGroup;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;

class AdminProgramSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = \Modules\Admin\Models\User::first()?->id ?? 1;

        $programs = [
            [
                'title'            => 'Programa Lombar Básico',
                'description'      => 'Programa de reabilitação para lombalgia crônica com foco em estabilização e fortalecimento.',
                'area'             => 'Traumato-Ortopédica',
                'duration_minutes' => 40,
                'is_active'        => true,
                'groups'           => [
                    [
                        'name'      => 'Aquecimento',
                        'exercises' => [
                            ['name' => 'Rotação Torácica em Sedestação', 'sets_min' => 2, 'sets_max' => 3, 'reps_min' => 10, 'reps_max' => 10, 'rest_time' => 30, 'period' => 'morning'],
                        ],
                    ],
                    [
                        'name'      => 'Principal',
                        'exercises' => [
                            ['name' => 'Ponte Glútea',  'sets_min' => 3, 'sets_max' => 3, 'reps_min' => 15, 'reps_max' => 15, 'rest_time' => 60, 'period' => 'morning'],
                            ['name' => 'Bird Dog',      'sets_min' => 3, 'sets_max' => 3, 'reps_min' => 10, 'reps_max' => 10, 'rest_time' => 45, 'period' => 'morning'],
                        ],
                    ],
                ],
            ],
            [
                'title'            => 'Reabilitação Cervical Postural',
                'description'      => 'Protocolo para correção de postura anteriorizada de cabeça e fortalecimento cervical.',
                'area'             => 'Traumato-Ortopédica',
                'duration_minutes' => 30,
                'is_active'        => true,
                'groups'           => [
                    [
                        'name'      => 'Mobilidade',
                        'exercises' => [
                            ['name' => 'Rotação Torácica em Sedestação', 'sets_min' => 2, 'sets_max' => 2, 'reps_min' => 10, 'reps_max' => 10, 'rest_time' => 30, 'period' => null],
                        ],
                    ],
                    [
                        'name'      => 'Fortalecimento',
                        'exercises' => [
                            ['name' => 'Retração Cervical', 'sets_min' => 3, 'sets_max' => 3, 'reps_min' => 12, 'reps_max' => 12, 'rest_time' => 30, 'period' => null],
                        ],
                    ],
                ],
            ],
            [
                'title'            => 'Retorno Esportivo — Joelho e Tornozelo',
                'description'      => 'Programa progressivo de retorno ao esporte após lesão ligamentar de joelho ou entorse de tornozelo.',
                'area'             => 'Esportiva',
                'duration_minutes' => 50,
                'is_active'        => true,
                'groups'           => [
                    [
                        'name'      => 'Fortalecimento Funcional',
                        'exercises' => [
                            ['name' => 'Agachamento Unilateral (Single Leg Squat)', 'sets_min' => 3, 'sets_max' => 4, 'reps_min' => 8, 'reps_max' => 10, 'rest_time' => 90, 'period' => 'afternoon'],
                            ['name' => 'Elevação de Calcâneo (Calf Raise)',         'sets_min' => 3, 'sets_max' => 3, 'reps_min' => 20, 'reps_max' => 20, 'rest_time' => 60, 'period' => 'afternoon'],
                        ],
                    ],
                ],
            ],
            [
                'title'            => 'Prevenção de Quedas para Idosos',
                'description'      => 'Protocolo de equilíbrio e fortalecimento para prevenção de quedas em pacientes idosos.',
                'area'             => 'Gerontologia',
                'duration_minutes' => 35,
                'is_active'        => true,
                'groups'           => [
                    [
                        'name'      => 'Equilíbrio e Marcha',
                        'exercises' => [
                            ['name' => 'Marcha Estacionária com Elevação de Joelho', 'sets_min' => 2, 'sets_max' => 3, 'reps_min' => 20, 'reps_max' => 20, 'rest_time' => 60, 'period' => 'morning'],
                        ],
                    ],
                    [
                        'name'      => 'Fortalecimento',
                        'exercises' => [
                            ['name' => 'Ponte Glútea', 'sets_min' => 2, 'sets_max' => 3, 'reps_min' => 12, 'reps_max' => 15, 'rest_time' => 60, 'period' => 'morning'],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($programs as $programData) {
            $area = PhysioArea::where('name', $programData['area'])->first();

            $program = AdminProgram::create([
                'created_by'       => $adminId,
                'title'            => $programData['title'],
                'description'      => $programData['description'],
                'physio_area_id'   => $area?->id,
                'duration_minutes' => $programData['duration_minutes'],
                'is_active'        => $programData['is_active'],
            ]);

            foreach ($programData['groups'] as $groupIndex => $groupData) {
                $group = AdminProgramGroup::create([
                    'admin_program_id' => $program->id,
                    'name'             => $groupData['name'],
                    'sort_order'       => $groupIndex,
                ]);

                foreach ($groupData['exercises'] as $exIndex => $exData) {
                    $exercise = Exercise::where('name', $exData['name'])->first();
                    if (!$exercise) {
                        continue;
                    }

                    AdminProgramExercise::create([
                        'admin_program_id'       => $program->id,
                        'admin_program_group_id' => $group->id,
                        'exercise_id'            => $exercise->id,
                        'sets_min'               => $exData['sets_min'],
                        'sets_max'               => $exData['sets_max'],
                        'repetitions_min'        => $exData['reps_min'],
                        'repetitions_max'        => $exData['reps_max'],
                        'rest_time'              => $exData['rest_time'],
                        'period'                 => $exData['period'],
                        'sort_order'             => $exIndex,
                    ]);
                }
            }
        }
    }
}
