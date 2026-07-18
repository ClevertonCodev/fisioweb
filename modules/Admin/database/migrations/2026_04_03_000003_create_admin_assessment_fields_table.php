<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_assessment_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_assessment_section_id')->constrained('admin_assessment_sections')->cascadeOnDelete();
            $table->string('label');
            $table->string('field_type', 30);
            $table->boolean('required')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->json('config')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_assessment_fields');
    }
};
