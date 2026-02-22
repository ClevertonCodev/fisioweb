<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exercise_favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['clinic_user_id', 'exercise_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercise_favorites');
    }
};
