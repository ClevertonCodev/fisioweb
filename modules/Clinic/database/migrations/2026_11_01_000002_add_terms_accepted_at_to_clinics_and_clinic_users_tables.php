<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinics', function (Blueprint $table): void {
            $table->timestamp('terms_accepted_at')->nullable()->after('plan_id');
        });

        Schema::table('clinic_users', function (Blueprint $table): void {
            $table->timestamp('terms_accepted_at')->nullable()->after('email_verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('clinic_users', function (Blueprint $table): void {
            $table->dropColumn('terms_accepted_at');
        });

        Schema::table('clinics', function (Blueprint $table): void {
            $table->dropColumn('terms_accepted_at');
        });
    }
};
