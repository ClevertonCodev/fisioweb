<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Tests\TestCase;

/**
 * GET /clinic/finances/transactions?q=...: com `q` e sem `period`/`from`/`to`, a busca vai em todo
 * o histórico (o mês atual não é imposto), da data mais nova para a mais antiga, sem diferenciar
 * maiúscula, na descrição e no nome da categoria, com filtro opcional por tipo.
 */
class FinanceTransactionSearchTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(12, 0));

        $this->clinic = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id]);
    }

    public function test_search_ignores_case_and_spans_the_whole_history_newest_first(): void
    {
        // O LIKE do Postgres diferencia maiúscula; o PRAGMA faz o sqlite dos
        // testes se comportar igual, para o teste pegar a regressão.
        DB::statement('PRAGMA case_sensitive_like = ON');

        // A conexão sqlite em memória é a mesma em todos os testes e o rollback
        // não desfaz PRAGMA: o finally desliga antes do tearDown.
        try {
            $this->assertSame(0, (int) DB::selectOne("SELECT 'A' LIKE 'a' AS hit")->hit, 'PRAGMA não pegou');

            $rent       = $this->category($this->clinic, FinancialTransactionType::Saida, 'Aluguel');
            $other      = $this->category($this->clinic, FinancialTransactionType::Saida, 'Material');
            $october    = $this->transaction($this->clinic, $other, 'Aluguel da sala', '2026-10-05');
            $lastYear   = $this->transaction($this->clinic, $other, 'ALUGUEL março', '2025-03-10');
            $byCategory = $this->transaction($this->clinic, $rent, 'Sala 2', '2024-01-20');
            $water      = $this->transaction($this->clinic, $other, 'conta de água', '2026-02-01');
            $this->transaction($this->clinic, $other, 'Papel toalha', '2026-10-06');

            $cases = [
                'aluguel' => [$october->id, $lastYear->id, $byCategory->id],
                'ALUGUEL' => [$october->id, $lastYear->id, $byCategory->id],
                // O LOWER do sqlite só baixa ASCII (o Postgres baixa tudo): o termo precisa vir em mb_strtolower.
                'ÁGUA'    => [$water->id],
            ];

            foreach ($cases as $term => $expected) {
                $response = $this->search('q=' . urlencode($term));
                $this->assertSame($expected, array_column($response->json('data'), 'id'), "busca por {$term}");
                $this->assertSame(count($expected), $response->json('meta.total'), "total da busca por {$term}");
            }
        } finally {
            DB::statement('PRAGMA case_sensitive_like = OFF');
        }
    }

    public function test_without_search_the_listing_still_defaults_to_the_current_month(): void
    {
        $category = $this->category($this->clinic, FinancialTransactionType::Saida, 'Aluguel');
        $current  = $this->transaction($this->clinic, $category, 'Aluguel outubro', '2026-10-05');
        $this->transaction($this->clinic, $category, 'Aluguel março', '2025-03-10');

        $this->assertSame([$current->id], array_column($this->search('')->json('data'), 'id'));
    }

    public function test_search_with_a_period_stays_inside_the_period(): void
    {
        $category = $this->category($this->clinic, FinancialTransactionType::Saida, 'Aluguel');
        $current  = $this->transaction($this->clinic, $category, 'Aluguel outubro', '2026-10-05');
        $this->transaction($this->clinic, $category, 'Aluguel março', '2025-03-10');

        $this->assertSame([$current->id], array_column($this->search('q=aluguel&period=2026-10')->json('data'), 'id'));
    }

    public function test_the_type_filter_restricts_the_search(): void
    {
        $income  = $this->category($this->clinic, FinancialTransactionType::Entrada, 'Sessões');
        $expense = $this->category($this->clinic, FinancialTransactionType::Saida, 'Contas');
        $in      = $this->transaction($this->clinic, $income, 'Pacote Maria', '2025-06-01');
        $out     = $this->transaction($this->clinic, $expense, 'Pacote de internet', '2026-01-10');

        $this->assertSame([$out->id, $in->id], array_column($this->search('q=pacote')->json('data'), 'id'));
        $this->assertSame([$in->id], array_column($this->search('q=pacote&type=entrada')->json('data'), 'id'));
        $this->assertSame([$out->id], array_column($this->search('q=pacote&type=saida')->json('data'), 'id'));
    }

    public function test_the_search_does_not_match_the_type_name(): void
    {
        $income = $this->category($this->clinic, FinancialTransactionType::Entrada, 'Sessões');
        $this->transaction($this->clinic, $income, 'Pacote Maria', '2026-10-05');

        $this->search('q=entrada')->assertJsonCount(0, 'data');
    }

    public function test_the_search_is_paginated(): void
    {
        $category = $this->category($this->clinic, FinancialTransactionType::Saida, 'Contas');
        for ($i = 1; $i <= 12; $i++) {
            $this->transaction($this->clinic, $category, "Luz {$i}", sprintf('2025-%02d-01', $i));
        }

        $first  = $this->search('q=luz&per_page=10');
        $second = $this->search('q=luz&per_page=10&page=2');

        $first->assertJsonCount(10, 'data')->assertJsonPath('meta.total', 12)->assertJsonPath('meta.page', 1);
        $second->assertJsonCount(2, 'data')->assertJsonPath('meta.page', 2);
        $this->assertSame('Luz 12', $first->json('data.0.description'));
        $this->assertSame('Luz 1', $second->json('data.1.description'));
    }

    public function test_percent_underscore_and_the_escape_character_in_the_search_are_literal(): void
    {
        $category = $this->category($this->clinic, FinancialTransactionType::Saida, 'Contas');
        $percent  = $this->transaction($this->clinic, $category, 'Desconto 50%', '2026-10-05');
        $this->transaction($this->clinic, $category, 'Desconto 500', '2026-10-04');
        $under    = $this->transaction($this->clinic, $category, 'conta_luz', '2026-10-03');
        $this->transaction($this->clinic, $category, 'contaXluz', '2026-10-02');
        $bang     = $this->transaction($this->clinic, $category, 'Promo!Dez', '2026-10-01');
        $slash    = $this->transaction($this->clinic, $category, 'Pasta C:\\docs', '2026-09-30');

        $cases = [
            '50%'      => [$percent->id],
            '%%'       => [],
            'a_l'      => [$under->id],
            'o!d'      => [$bang->id],
            'c:\\docs' => [$slash->id],
        ];

        foreach ($cases as $term => $expected) {
            $this->assertSame($expected, array_column($this->search('q=' . urlencode($term))->json('data'), 'id'), "busca por {$term}");
        }
    }

    public function test_another_clinic_never_appears_in_the_search(): void
    {
        $other      = Clinic::factory()->create(['timezone' => 'UTC']);
        $otherAdmin = ClinicUser::factory()->create(['clinic_id' => $other->id]);
        $mine       = $this->transaction($this->clinic, $this->category($this->clinic, FinancialTransactionType::Saida, 'Aluguel'), 'Aluguel', '2025-03-10');
        $theirs     = $this->transaction($other, $this->category($other, FinancialTransactionType::Saida, 'Aluguel'), 'Aluguel', '2024-03-10');

        $this->assertSame([$mine->id], array_column($this->search('q=aluguel')->json('data'), 'id'));
        $this->assertSame([$theirs->id], array_column($this->search('q=aluguel', $otherAdmin)->json('data'), 'id'));
    }

    public function test_trashed_transactions_never_appear_in_the_search(): void
    {
        $category = $this->category($this->clinic, FinancialTransactionType::Saida, 'Aluguel');
        $this->transaction($this->clinic, $category, 'Aluguel', '2025-03-10')->delete();

        $this->search('q=aluguel')->assertJsonCount(0, 'data');
    }

    public function test_secretary_searches_and_physiotherapist_is_forbidden(): void
    {
        $tx              = $this->transaction($this->clinic, $this->category($this->clinic, FinancialTransactionType::Saida, 'Aluguel'), 'Aluguel', '2025-03-10');
        $secretary       = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $physiotherapist = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        $this->assertSame([$tx->id], array_column($this->search('q=aluguel', $secretary)->json('data'), 'id'));
        $this->actingAs($physiotherapist, 'clinic')
            ->getJson('/api/clinic/finances/transactions?q=aluguel')
            ->assertForbidden();
    }

    public function test_search_term_and_type_are_validated(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/transactions?q[]=aluguel')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('q');

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/transactions?q=' . str_repeat('a', 101))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('q');

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/transactions?q=aluguel&type=transferencia')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('type');
    }

    private function search(string $query, ?ClinicUser $user = null): TestResponse
    {
        return $this->actingAs($user ?? $this->admin, 'clinic')
            ->getJson("/api/clinic/finances/transactions?{$query}")
            ->assertOk();
    }

    private function category(Clinic $clinic, FinancialTransactionType $type, string $name): FinancialCategory
    {
        return FinancialCategory::factory()->create([
            'clinic_id' => $clinic->id,
            'type'      => $type,
            'name'      => $name,
        ]);
    }

    private function transaction(Clinic $clinic, FinancialCategory $category, string $description, string $date): FinancialTransaction
    {
        return FinancialTransaction::factory()->create([
            'clinic_id'             => $clinic->id,
            'financial_category_id' => $category->id,
            'created_by_user_id'    => $this->admin->id,
            'type'                  => $category->type,
            'status'                => $category->type === FinancialTransactionType::Entrada
                ? FinancialTransactionStatus::Recebido
                : FinancialTransactionStatus::Pago,
            'payment_method'        => PaymentMethod::Pix,
            'description'           => $description,
            'date'                  => $date,
            'gross_amount'          => 10,
            'fee_amount'            => 0,
            'net_amount'            => 10,
        ]);
    }
}
