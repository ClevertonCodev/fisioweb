<?php

namespace Modules\Clinic\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Clinic\Enums\FinancialTransactionStatus;
use Modules\Clinic\Enums\FinancialTransactionType;
use Modules\Clinic\Enums\PaymentMethod;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\FinancialCategory;
use Modules\Clinic\Models\FinancialTransaction;

/**
 * @extends Factory<FinancialTransaction>
 */
class FinancialTransactionFactory extends Factory
{
    protected $model = FinancialTransaction::class;

    public function definition(): array
    {
        $gross = fake()->randomFloat(2, 10, 500);
        $fee   = 0;

        return [
            'clinic_id'              => Clinic::factory(),
            'financial_category_id'  => FinancialCategory::factory(),
            'type'                   => FinancialTransactionType::Entrada,
            'status'                 => FinancialTransactionStatus::Recebido,
            'payment_method'         => PaymentMethod::Pix,
            'date'                   => fake()->dateTimeBetween('-1 month', 'now'),
            'description'            => fake()->sentence(3),
            'gross_amount'           => $gross,
            'fee_amount'             => $fee,
            'net_amount'             => FinancialTransaction::computeNetAmount($gross, $fee),
            'notes'                  => null,
            'created_by_user_id'     => ClinicUser::factory(),
        ];
    }

    public function forClinic(Clinic $clinic): static
    {
        return $this->state(fn () => ['clinic_id' => $clinic->id]);
    }
}
