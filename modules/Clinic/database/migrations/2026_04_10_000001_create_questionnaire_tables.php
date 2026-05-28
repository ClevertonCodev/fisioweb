<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Templates de questionário criados pelo fisioterapeuta
        Schema::create('questionnaire_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('clinic_id');
        });

        // Seções do template (ex.: "Exame Físico", "Anamnese")
        Schema::create('questionnaire_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('questionnaire_template_id')->constrained('questionnaire_templates')->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Perguntas dentro de cada seção
        Schema::create('questionnaire_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('questionnaire_section_id')->constrained('questionnaire_sections')->cascadeOnDelete();
            $table->string('label');
            $table->enum('type', ['multiple_choice', 'checkbox', 'scale', 'text']);
            $table->json('options')->nullable();   // para multiple_choice e checkbox
            $table->unsignedTinyInteger('scale_min')->default(0);  // para scale
            $table->unsignedTinyInteger('scale_max')->default(10); // para scale
            $table->boolean('required')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Envio do questionário ao paciente
        Schema::create('patient_questionnaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('clinic_user_id')->nullable()->constrained('clinic_users')->nullOnDelete();
            $table->foreignId('questionnaire_template_id')->constrained('questionnaire_templates')->cascadeOnDelete();
            $table->enum('modality', ['presencial', 'remoto']);
            $table->enum('status', ['pending', 'answered', 'expired'])->default('pending');
            $table->timestamp('answered_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['clinic_id', 'patient_id']);
        });

        // Respostas do paciente por pergunta
        Schema::create('patient_questionnaire_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_questionnaire_id')->constrained('patient_questionnaires')->cascadeOnDelete();
            $table->foreignId('questionnaire_question_id')->constrained('questionnaire_questions')->cascadeOnDelete();
            $table->json('answer'); // string, number, array de opções — flexível por tipo
            $table->timestamps();

            $table->unique(['patient_questionnaire_id', 'questionnaire_question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_questionnaire_answers');
        Schema::dropIfExists('patient_questionnaires');
        Schema::dropIfExists('questionnaire_questions');
        Schema::dropIfExists('questionnaire_sections');
        Schema::dropIfExists('questionnaire_templates');
    }
};
