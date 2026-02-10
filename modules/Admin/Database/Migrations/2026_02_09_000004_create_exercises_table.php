<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('physio_area_id')->constrained('physio_areas')->restrictOnDelete();
            $table->foreignId('physio_subarea_id')->nullable()->constrained('physio_subareas')->nullOnDelete();
            $table->foreignId('body_region_id')->constrained('body_regions')->restrictOnDelete();
            $table->string('therapeutic_goal')->nullable();
            $table->text('description')->nullable();
            $table->text('audio_description')->nullable();
            $table->string('difficulty_level')->default('medium')->comment('easy, medium, hard');
            $table->string('muscle_group')->nullable();
            $table->string('movement_type')->nullable();
            $table->string('movement_form')->nullable()->comment('alternado, bilateral, unilateral');
            $table->string('kinetic_chain')->nullable();
            $table->string('decubitus')->nullable();
            $table->text('indications')->nullable();
            $table->text('contraindications')->nullable();
            $table->string('frequency')->nullable();
            $table->unsignedSmallInteger('sets')->nullable();
            $table->unsignedSmallInteger('repetitions')->nullable();
            $table->unsignedSmallInteger('rest_time')->nullable()->comment('segundos');
            $table->text('clinical_notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('physio_area_id');
            $table->index('body_region_id');
            $table->index('difficulty_level');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercises');
    }
};
