<?php

namespace Modules\ClinicFinance\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicFinance\Models\FinancialCategory;

interface FinancialCategoryRepositoryInterface
{
    public function listAvailableForClinic(int $clinicId, ?string $type = null): Collection;

    /**
     * Ligadas e desligadas (Configurações), cada uma com `disabled_for_clinic`: se a clínica
     * desligou essa do sistema. O `active` é o gravado; o que vale para a clínica, o Service decide.
     */
    public function listManageableForClinic(int $clinicId, ?string $type = null): Collection;

    public function find(int $id): ?FinancialCategory;

    public function findAvailableForClinic(int $clinicId, int $categoryId): ?FinancialCategory;

    public function createCustom(int $clinicId, string $name, string $type): FinancialCategory;

    /** Se a clínica desligou esta categoria do sistema (há o registro de desligada). */
    public function isDisabledForClinic(int $clinicId, int $categoryId): bool;

    /** Grava (ou apaga) o registro de que a clínica desligou esta categoria do sistema. */
    public function setDisabledForClinic(int $clinicId, int $categoryId, bool $disabled): void;

    /** Liga ou desliga a categoria própria da clínica; devolve como ficou no banco. */
    public function setActive(FinancialCategory $category, bool $active): FinancialCategory;

    public function deleteCustom(FinancialCategory $category): bool;

    /**
     * Se algo ainda aponta para a categoria: lançamento (inclusive na lixeira, que pode voltar)
     * ou série de parcelas/recorrência. Com isso, excluir é 409 em vez de quebrar a chave estrangeira.
     */
    public function hasTransactions(FinancialCategory $category): bool;
}
