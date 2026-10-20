<?php

namespace Tests\Architecture;

use PHPUnit\Framework\TestCase;

/**
 * ClinicUser usa soft delete (ADR 022). Toda relação belongsTo para ele em
 * um model é histórico (quem atendeu, criou, assinou) e precisa de
 * ->withTrashed(), senão o nome de quem saiu some da tela e do PDF. As
 * exceções são relações que só fazem sentido para quem está na equipe.
 */
class ClinicUserHistoryRelationTest extends TestCase
{
    /** Relações pessoais de quem está na equipe: sem withTrashed de propósito. */
    private const ALLOWED_WITHOUT_TRASHED = [
        'modules/Clinic/app/Models/ExerciseFavorite.php',
    ];

    public function test_belongs_to_clinic_user_includes_trashed(): void
    {
        $root       = dirname(__DIR__, 2);
        $violations = [];

        foreach (glob($root . '/modules/*/app/Models/*.php') as $file) {
            $relative = substr($file, strlen($root) + 1);
            if (in_array($relative, self::ALLOWED_WITHOUT_TRASHED, true)) {
                continue;
            }

            foreach (file($file) as $number => $line) {
                if (preg_match('/belongsTo\(\s*\\\\?(Modules\\\\Clinic\\\\Models\\\\)?ClinicUser::class/', $line)
                    && !str_contains($line, 'withTrashed()')) {
                    $violations[] = $relative . ':' . ($number + 1);
                }
            }
        }

        $this->assertSame([], $violations, 'belongsTo(ClinicUser) sem ->withTrashed() (ADR 022): ' . implode(', ', $violations));
    }
}
