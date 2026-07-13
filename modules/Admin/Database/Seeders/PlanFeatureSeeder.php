<?php

namespace Modules\Admin\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Models\Feature;
use Modules\Admin\Models\FeaturePlan;
use Modules\Admin\Models\Plan;

class PlanFeatureSeeder extends Seeder
{
    /**
     * Catálogo comercial: funcionalidades com valor isolado, planos por usuário
     * e vínculos funcionalidade↔plano. Idempotente por key/name.
     */
    private const FEATURES = [
        Feature::KEY_AGENDA               => ['name' => 'Agenda', 'value_isolated' => 10.00],
        Feature::KEY_PROGRAMAS_EXERCICIOS => ['name' => 'Programas e Exercícios', 'value_isolated' => 15.00],
        Feature::KEY_FINANCAS             => ['name' => 'Finanças', 'value_isolated' => 5.00],
        Feature::KEY_APP                  => ['name' => 'App', 'value_isolated' => 20.00],
    ];

    private const PLANS = [
        'Start' => [
            'value_month' => 20.00,
            'value_year'  => 15.00,
            'features'    => [],
        ],
        'Performance' => [
            'value_month' => 30.00,
            'value_year'  => 25.00,
            'features'    => [Feature::KEY_AGENDA, Feature::KEY_PROGRAMAS_EXERCICIOS, Feature::KEY_FINANCAS],
        ],
        'Premium' => [
            'value_month' => 40.00,
            'value_year'  => 35.00,
            'features'    => [Feature::KEY_AGENDA, Feature::KEY_PROGRAMAS_EXERCICIOS, Feature::KEY_FINANCAS, Feature::KEY_APP],
        ],
    ];

    public function run(): void
    {
        $features = [];

        foreach (self::FEATURES as $key => $data) {
            $features[$key] = Feature::updateOrCreate(
                ['key' => $key],
                [
                    'name'           => $data['name'],
                    'value_isolated' => $data['value_isolated'],
                    'type'           => 'bool',
                ]
            );
        }

        // Remove funcionalidades fora do catálogo (ex.: video_call, teste1..10) e seus vínculos
        $obsoleteIds = Feature::whereNotIn('key', array_keys(self::FEATURES))->pluck('id');
        if ($obsoleteIds->isNotEmpty()) {
            FeaturePlan::whereIn('feature_id', $obsoleteIds)->delete();
            Feature::whereIn('id', $obsoleteIds)->delete();
        }

        foreach (self::PLANS as $name => $data) {
            $plan = Plan::updateOrCreate(
                ['name' => $name],
                [
                    'type_charge' => Plan::TYPE_CHARGE_POR_USUARIO,
                    'value_month' => $data['value_month'],
                    'value_year'  => $data['value_year'],
                ]
            );

            $featureIds = array_map(fn (string $key) => $features[$key]->id, $data['features']);

            FeaturePlan::where('plan_id', $plan->id)
                ->whereNotIn('feature_id', $featureIds)
                ->delete();

            foreach ($featureIds as $featureId) {
                FeaturePlan::updateOrCreate(
                    ['plan_id' => $plan->id, 'feature_id' => $featureId],
                    ['value' => true]
                );
            }
        }

        $this->command->info('Funcionalidades e planos comerciais semeados.');
    }
}
