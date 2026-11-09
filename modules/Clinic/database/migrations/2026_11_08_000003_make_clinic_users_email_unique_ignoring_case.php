<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * O login acha o usuário por LOWER(email): duas contas que só diferem nas
 * maiúsculas dividiriam o mesmo login. Sem conversão de dado: e-mails
 * duplicados ignorando maiúsculas precisam ser ajustados à mão antes.
 *
 * No SQLite, um `->change()` futuro em `clinic_users` recria a tabela e não
 * sabe refazer este índice: a migration precisa derrubá-lo antes e criá-lo de
 * novo depois.
 */
return new class extends Migration
{
    private const INDEX = 'clinic_users_email_lower_unique';

    public function up(): void
    {
        Schema::table('clinic_users', function (Blueprint $table) {
            $table->dropUnique(['email']);
        });

        $expression = DB::getDriverName() === 'mysql' ? '((LOWER(email)))' : '(LOWER(email))';

        DB::statement('CREATE UNIQUE INDEX ' . self::INDEX . " ON clinic_users {$expression}");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('DROP INDEX ' . self::INDEX . ' ON clinic_users');
        } else {
            DB::statement('DROP INDEX ' . self::INDEX);
        }

        Schema::table('clinic_users', function (Blueprint $table) {
            $table->unique('email');
        });
    }
};
