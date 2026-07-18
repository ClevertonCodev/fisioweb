<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_exercise_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exercise_id')->constrained('admin_exercises')->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('file_path');
            $table->string('cdn_url')->nullable();
            $table->string('original_filename');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['exercise_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_exercise_media');
    }
};
