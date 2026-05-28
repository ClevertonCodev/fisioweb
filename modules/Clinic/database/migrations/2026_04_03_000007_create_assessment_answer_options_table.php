<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_answer_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained('assessments')->cascadeOnDelete();
            $table->foreignId('admin_assessment_field_id')->constrained('admin_assessment_fields')->cascadeOnDelete();
            $table->foreignId('admin_assessment_field_option_id')->constrained('admin_assessment_field_options')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(
                ['assessment_id', 'admin_assessment_field_id', 'admin_assessment_field_option_id'],
                'assessment_answer_options_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_answer_options');
    }
};
