<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_program_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_program_id')->constrained('admin_programs')->cascadeOnDelete();
            $table->foreignId('admin_program_group_id')->nullable()->constrained('admin_program_groups')->nullOnDelete();
            $table->foreignId('exercise_id')->constrained('admin_exercises')->restrictOnDelete();
            $table->json('days_of_week')->nullable();
            $table->string('period')->nullable();
            $table->unsignedTinyInteger('sets_min')->nullable();
            $table->unsignedTinyInteger('sets_max')->nullable();
            $table->unsignedTinyInteger('repetitions_min')->nullable();
            $table->unsignedTinyInteger('repetitions_max')->nullable();
            $table->decimal('load_min', 5, 2)->nullable();
            $table->decimal('load_max', 5, 2)->nullable();
            $table->unsignedSmallInteger('rest_time')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_program_exercises');
    }
};
