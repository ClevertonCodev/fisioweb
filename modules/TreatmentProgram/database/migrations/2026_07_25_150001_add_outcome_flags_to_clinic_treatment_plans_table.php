<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_treatment_plans', function (Blueprint $table) {
            $table->boolean('outcome_pain_enabled')->default(true)->after('patient_completed_count');
            $table->boolean('outcome_difficulty_enabled')->default(true)->after('outcome_pain_enabled');
            $table->boolean('outcome_satisfaction_enabled')->default(true)->after('outcome_difficulty_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('clinic_treatment_plans', function (Blueprint $table) {
            $table->dropColumn([
                'outcome_pain_enabled',
                'outcome_difficulty_enabled',
                'outcome_satisfaction_enabled',
            ]);
        });
    }
};
