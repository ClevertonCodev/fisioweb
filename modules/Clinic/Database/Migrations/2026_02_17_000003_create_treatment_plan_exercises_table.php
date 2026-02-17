<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treatment_plan_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('treatment_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('treatment_plan_group_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->json('days_of_week')->nullable();
            $table->string('period', 20)->nullable();
            $table->unsignedTinyInteger('sets_min')->nullable();
            $table->unsignedTinyInteger('sets_max')->nullable();
            $table->unsignedSmallInteger('repetitions_min')->nullable();
            $table->unsignedSmallInteger('repetitions_max')->nullable();
            $table->decimal('load_min', 8, 2)->nullable();
            $table->decimal('load_max', 8, 2)->nullable();
            $table->string('rest_time', 50)->nullable();
            $table->text('notes')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['treatment_plan_id', 'sort_order']);
            $table->index(['exercise_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treatment_plan_exercises');
    }
};
