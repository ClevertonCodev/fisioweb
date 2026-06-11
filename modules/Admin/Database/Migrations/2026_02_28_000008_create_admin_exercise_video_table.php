<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_exercise_video', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exercise_id')->constrained('admin_exercises')->cascadeOnDelete();
            $table->foreignId('video_id')->constrained('media_videos')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['exercise_id', 'video_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_exercise_video');
    }
};
