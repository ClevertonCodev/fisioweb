<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Token emitido antes desta data é recusado pelo guard `clinic`: trocar a
 * senha derruba as outras sessões.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_users', function (Blueprint $table) {
            $table->timestamp('password_changed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('clinic_users', function (Blueprint $table) {
            $table->dropColumn('password_changed_at');
        });
    }
};
