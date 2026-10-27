<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_treatment_plan_execution_series', function (Blueprint $table) {
            $table->id();
            $table->foreignId('execution_id')->constrained('clinic_treatment_plan_executions')->cascadeOnDelete();
            $table->foreignId('treatment_plan_exercise_id')->constrained('clinic_treatment_plan_exercises')->cascadeOnDelete();
            $table->unsignedInteger('series_index');
            $table->unsignedInteger('count')->nullable();
            $table->string('weight_value')->nullable();
            $table->string('weight_unit')->nullable();
            $table->boolean('is_bodyweight')->default(false);
            $table->timestamps();

            $table->index(['execution_id', 'treatment_plan_exercise_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_treatment_plan_execution_series');
    }
};
