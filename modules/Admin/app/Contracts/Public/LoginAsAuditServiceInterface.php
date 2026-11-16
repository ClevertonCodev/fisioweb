<?php

namespace Modules\Admin\Contracts\Public;

/**
 * Registro do "entrar como" do operador. Só o painel admin lê: nenhuma rota
 * da clínica devolve estas entradas.
 */
interface LoginAsAuditServiceInterface
{
    public function record(LoginAsAuditEntry $entry): void;

    /**
     * @return list<RecentLoginAs> as mais recentes primeiro
     */
    public function recentForClinic(int $clinicId, int $limit = 10): array;
}
