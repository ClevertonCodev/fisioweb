<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\ClinicQuestionnaire\Database\BackfillPatientQuestionnairePublicTokens;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_patient_questionnaires', function (Blueprint $table) {
            $table->uuid('public_token')->nullable();
        });

        (new BackfillPatientQuestionnairePublicTokens)();

        Schema::table('clinic_patient_questionnaires', function (Blueprint $table) {
            $table->unique('public_token');
        });
    }

    public function down(): void
    {
        Schema::table('clinic_patient_questionnaires', function (Blueprint $table) {
            $table->dropUnique(['public_token']);
            $table->dropColumn('public_token');
        });
    }
};
