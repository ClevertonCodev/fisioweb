<?php

namespace Modules\Admin\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Models\BodyRegion;

class BodyRegionSeeder extends Seeder
{
    public function run(): void
    {
        $regions = [
            'Membros Superiores' => [
                'Ombro',
                'Cotovelo',
                'Punho',
                'Mão',
            ],
            'Membros Inferiores' => [
                'Quadril',
                'Joelho',
                'Tornozelo',
                'Pé',
            ],
            'Tronco' => [
                'Coluna Cervical',
                'Coluna Torácica',
                'Coluna Lombar',
                'Pelve',
            ],
            'Cabeça e Pescoço' => [
                'ATM',
                'Cervical Alta',
                'Musculatura Cervical',
            ],
        ];

        foreach ($regions as $parentName => $children) {
            $parent = BodyRegion::updateOrCreate(
                ['name' => $parentName, 'parent_id' => null]
            );

            foreach ($children as $childName) {
                BodyRegion::updateOrCreate(
                    ['name' => $childName, 'parent_id' => $parent->id]
                );
            }
        }
    }
}
