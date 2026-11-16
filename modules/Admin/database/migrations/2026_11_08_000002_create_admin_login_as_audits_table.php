<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `clinic_id` e `clinic_user_id` ficam sem chave estrangeira: as tabelas são
 * do módulo Clinic, e o registro precisa sobreviver à clínica ou ao usuário.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_login_as_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_user_id')->constrained('users');
            $table->unsignedBigInteger('clinic_id');
            $table->unsignedBigInteger('clinic_user_id');
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['clinic_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_login_as_audits');
    }
};
