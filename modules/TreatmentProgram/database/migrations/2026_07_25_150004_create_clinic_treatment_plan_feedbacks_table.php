<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_treatment_plan_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('treatment_plan_id')->constrained('clinic_treatment_plans')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('execution_id')->nullable()->constrained('clinic_treatment_plan_executions')->nullOnDelete();
            $table->unsignedTinyInteger('pain')->nullable();
            $table->text('pain_notes')->nullable();
            $table->unsignedTinyInteger('difficulty')->nullable();
            $table->text('difficulty_notes')->nullable();
            $table->string('satisfaction')->nullable();
            $table->text('satisfaction_notes')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->index(['treatment_plan_id', 'patient_id']);
            $table->index(['execution_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_treatment_plan_feedbacks');
    }
};
