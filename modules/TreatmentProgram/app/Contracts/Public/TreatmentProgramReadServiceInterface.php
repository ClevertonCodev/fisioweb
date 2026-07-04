<?php

namespace Modules\TreatmentProgram\Contracts\Public;

/**
 * Contrato público de leitura de programas de tratamento para consumidores de
 * outros módulos (ex.: Dashboard no módulo Clinic). Consumidores dependem
 * apenas desta interface, nunca do Model/Repository privado.
 */
interface TreatmentProgramReadServiceInterface
{
    /**
     * Contagem de programas ativos da clínica no mês corrente, opcionalmente
     * filtrada por profissional. Considera apenas planos com paciente ativo,
     * com início até o fim do mês e sem término antes do início do mês.
     *
     * @param  string  $monthStart  Data (Y-m-d) do início do mês.
     * @param  string  $monthEnd  Data (Y-m-d) do fim do mês.
     */
    public function activeProgramsCount(
        int $clinicId,
        ?int $clinicUserId,
        string $monthStart,
        string $monthEnd,
    ): int;
}
