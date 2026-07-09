<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_exercises', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('physio_area_id')->constrained('admin_physio_areas')->restrictOnDelete();
            $table->foreignId('physio_subarea_id')->nullable()->constrained('admin_physio_subareas')->nullOnDelete();
            $table->foreignId('body_region_id')->nullable()->constrained('admin_body_regions')->restrictOnDelete();
            $table->string('therapeutic_goal')->nullable();
            $table->text('description')->nullable();
            $table->text('audio_description')->nullable();
            $table->string('difficulty_level')->default('medium');
            $table->string('muscle_group')->nullable();
            $table->string('movement_type')->nullable();
            $table->string('movement_form')->nullable();
            $table->string('kinetic_chain')->nullable();
            $table->string('decubitus')->nullable();
            $table->text('indications')->nullable();
            $table->text('contraindications')->nullable();
            $table->string('frequency')->nullable();
            $table->unsignedSmallInteger('sets')->nullable();
            $table->unsignedSmallInteger('repetitions')->nullable();
            $table->unsignedSmallInteger('rest_time')->nullable();
            $table->text('clinical_notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->boolean('is_active')->default(true);

            // Exercícios enviados por clínicas + fluxo de revisão do admin do sistema.
            $table->foreignId('clinic_id')->nullable()->constrained('clinics')->nullOnDelete();
            $table->string('review_status')->default('approved');
            $table->foreignId('submitted_by_clinic_user_id')->nullable()->constrained('clinic_users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('physio_area_id');
            $table->index('body_region_id');
            $table->index('difficulty_level');
            $table->index('is_active');
            $table->index('clinic_id');
            $table->index('review_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_exercises');
    }
};
