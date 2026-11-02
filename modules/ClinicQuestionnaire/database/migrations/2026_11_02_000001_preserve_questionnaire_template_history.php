<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_questionnaire_sections', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable();
        });

        Schema::table('clinic_questionnaire_questions', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable();
        });

        Schema::table('clinic_patient_questionnaire_answers', function (Blueprint $table) {
            $table->dropForeign(['questionnaire_question_id']);
            $table->foreign('questionnaire_question_id')
                ->references('id')
                ->on('clinic_questionnaire_questions')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('clinic_patient_questionnaire_answers', function (Blueprint $table) {
            $table->dropForeign(['questionnaire_question_id']);
            $table->foreign('questionnaire_question_id')
                ->references('id')
                ->on('clinic_questionnaire_questions')
                ->cascadeOnDelete();
        });

        Schema::table('clinic_questionnaire_questions', function (Blueprint $table) {
            $table->dropColumn('archived_at');
        });

        Schema::table('clinic_questionnaire_sections', function (Blueprint $table) {
            $table->dropColumn('archived_at');
        });
    }
};
