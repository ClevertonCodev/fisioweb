<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_patient_evolution_checked_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_evolution_id')->constrained('clinic_patient_evolutions')->cascadeOnDelete();
            $table->foreignId('evolution_template_item_id')->constrained('clinic_evolution_template_items')->cascadeOnDelete();
            $table->string('free_text_value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_patient_evolution_checked_items');
    }
};
