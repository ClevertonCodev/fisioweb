<?php

namespace Modules\Clinic\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Clinic\Enums\FinancialCategoryOrigin;
use Modules\Clinic\Enums\FinancialTransactionType;
use Modules\Clinic\Models\FinancialCategory;

class FinancialCategorySeeder extends Seeder
{
    public function run(): void
    {
        $entradas = [
            'Atendimento',
            'Atendimento em casa',
            'Aula',
            'Aula experimental',
            'Avaliação',
            'Consultoria',
            'Outras entradas',
            'Outro',
        ];

        $saidas = [
            'Água e esgoto',
            'Ajuste de balanço',
            'Alimentação',
            'Aluguel',
            'Assinaturas',
            'Combustível',
            'Contabilidade',
            'Energia elétrica',
            'Equipamentos',
            'Impostos',
            'Internet',
            'Marketing',
            'Material de escritório',
            'Plano de saúde',
            'Salários',
            'Serviços terceirizados',
            'Telefone',
            'Transporte',
            'Outras saídas',
        ];

        foreach ($entradas as $order => $name) {
            FinancialCategory::firstOrCreate(
                [
                    'clinic_id' => null,
                    'name'      => $name,
                    'type'      => FinancialTransactionType::Entrada->value,
                    'origin'    => FinancialCategoryOrigin::System->value,
                ],
                [
                    'active'        => true,
                    'display_order' => $order,
                ],
            );
        }

        foreach ($saidas as $order => $name) {
            FinancialCategory::firstOrCreate(
                [
                    'clinic_id' => null,
                    'name'      => $name,
                    'type'      => FinancialTransactionType::Saida->value,
                    'origin'    => FinancialCategoryOrigin::System->value,
                ],
                [
                    'active'        => true,
                    'display_order' => $order,
                ],
            );
        }
    }
}
