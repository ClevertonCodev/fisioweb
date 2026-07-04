<?php

namespace Modules\Admin\Contracts\Public;

/**
 * Contrato público de leitura do catálogo de exercícios do Admin. Consumidores
 * de outros módulos dependem apenas desta interface, nunca do Model Exercise.
 */
interface ExerciseCatalogReadServiceInterface
{
    /**
     * Defaults de prescrição de um exercício do catálogo, ou null se o
     * exercício não existir.
     */
    public function findPrescriptionDefaults(int $exerciseId): ?ExercisePrescriptionDefaults;
}
