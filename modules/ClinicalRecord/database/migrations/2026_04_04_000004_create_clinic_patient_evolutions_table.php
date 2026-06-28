<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_patient_evolutions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('clinic_user_id')->nullable()->constrained('clinic_users')->nullOnDelete();
            $table->foreignId('evolution_template_id')->nullable()->constrained('clinic_evolution_templates')->nullOnDelete();
            $table->string('title');
            $table->longText('generated_text')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('draft');
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['clinic_id', 'patient_id']);
            $table->index(['clinic_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_patient_evolutions');
    }
};
