<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_users', function (Blueprint $table) {
            $table->string('first_access_token_hash', 64)->nullable()->unique();
            $table->timestamp('first_access_token_created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('clinic_users', function (Blueprint $table) {
            $table->dropUnique(['first_access_token_hash']);
            $table->dropColumn(['first_access_token_hash', 'first_access_token_created_at']);
        });
    }
};
