<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Quem pagou a entrada (paciente) e, se quiser, qual atendimento. Sem FK: paciente e
 * atendimento são de outros módulos (Patient e ClinicScheduling), lidos por contrato.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_financial_transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('patient_id')->nullable()->after('financial_category_id');
            $table->unsignedBigInteger('appointment_id')->nullable()->after('patient_id');

            $table->index(['clinic_id', 'patient_id']);
        });
    }

    public function down(): void
    {
        Schema::table('clinic_financial_transactions', function (Blueprint $table) {
            $table->dropIndex(['clinic_id', 'patient_id']);
            $table->dropColumn(['patient_id', 'appointment_id']);
        });
    }
};
