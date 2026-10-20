<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Excluir usuário da clínica vira soft delete: a pessoa sai da equipe e perde
 * o acesso, e a agenda, o financeiro e o histórico que apontam para ela ficam.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_users', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        // Sem a coluna, o excluído viraria uma linha comum: fica inativo para
        // não voltar a entrar.
        DB::table('clinic_users')->whereNotNull('deleted_at')->update(['status' => 0]);

        Schema::table('clinic_users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
