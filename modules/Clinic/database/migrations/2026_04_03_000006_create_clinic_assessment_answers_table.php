<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_assessment_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained('clinic_assessments')->cascadeOnDelete();
            $table->foreignId('admin_assessment_field_id')->constrained('admin_assessment_fields')->cascadeOnDelete();
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['assessment_id', 'admin_assessment_field_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_assessment_answers');
    }
};
