<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->string('filename')->unique();
            $table->string('original_filename');
            $table->string('path');
            $table->text('url')->nullable();
            $table->text('cdn_url')->nullable();
            $table->string('mime_type');
            $table->unsignedBigInteger('size'); // in bytes
            $table->unsignedInteger('duration')->nullable(); // in seconds
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('thumbnail_path')->nullable();
            $table->text('thumbnail_url')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            
            // Polymorphic relationship (videos can belong to exercises, courses, etc.)
            $table->string('uploadable_type')->nullable();
            $table->unsignedBigInteger('uploadable_id')->nullable();
            $table->index(['uploadable_type', 'uploadable_id']);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
