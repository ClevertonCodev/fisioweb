<?php

namespace Modules\ClinicFinance\Policies;

/**
 * Regra de papel de Finanças, num lugar só (middleware e Policies).
 *
 * - Usar Finanças (lançar, editar, excluir, lixeira, resumo, relatório, exportar, ler categorias):
 *   administrador e secretária.
 * - Configurar Finanças (criar, ligar/desligar e excluir categoria; saldo inicial): só o administrador.
 *
 * O usuário vem do guard `clinic`; a regra pergunta o papel pelos métodos públicos dele,
 * sem importar o Model do módulo Clinic.
 */
final class FinanceAccess
{
    public static function canUse(mixed $user): bool
    {
        return self::isAdmin($user) || self::hasRole($user, 'isSecretary');
    }

    public static function canManageSettings(mixed $user): bool
    {
        return self::isAdmin($user);
    }

    private static function isAdmin(mixed $user): bool
    {
        return self::hasRole($user, 'isAdmin');
    }

    private static function hasRole(mixed $user, string $method): bool
    {
        return is_object($user) && method_exists($user, $method) && $user->{$method}() === true;
    }
}
