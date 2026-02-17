<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treatment_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('clinic_user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('message')->nullable();
            $table->foreignId('physio_area_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('physio_subarea_id')->nullable()->constrained()->nullOnDelete();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            $table->string('status', 20)->default('draft');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['clinic_id', 'status']);
            $table->index(['patient_id']);
            $table->index(['clinic_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treatment_plans');
    }
};
