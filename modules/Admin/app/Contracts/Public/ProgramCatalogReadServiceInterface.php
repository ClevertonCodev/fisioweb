<?php

namespace Modules\Admin\Contracts\Public;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Admin\Models\AdminProgram;

/**
 * Contrato público de leitura do catálogo de programas do Admin. Consumidores
 * de outros módulos (ex.: TreatmentProgram) dependem apenas desta interface,
 * nunca do Model/Repository privado do Admin.
 */
interface ProgramCatalogReadServiceInterface
{
    /**
     * Programas ativos paginados, no mesmo shape consumido pela listagem da
     * clínica: filtros `search` (título) e `physio_area_id`, com `physioArea`
     * e contagem de exercícios, ordenados do mais recente.
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters, int $perPage): LengthAwarePaginator;

    /**
     * Programa ativo com detalhes (área, autor, grupos/exercícios/vídeos) e
     * contagem de exercícios. Lança ModelNotFoundException se não existir ou
     * estiver inativo (preserva o `findOrFail`/404 atual).
     */
    public function findActiveWithDetails(int $id): AdminProgram;
}
