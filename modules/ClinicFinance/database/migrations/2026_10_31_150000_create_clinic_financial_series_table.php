<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Série de lançamentos: parcelamento (015) e recorrência (016). Os campos da
 * recorrência (`frequency`, `anchor_day`, `ends_on`, `generated_until`,
 * `next_occurrence_on`) já nascem aqui, nulos no parcelamento.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_financial_series', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->string('kind', 20);
            $table->string('frequency', 20)->nullable();
            $table->date('anchor_date');
            // Dia da regra (31 no "todo dia 31"): a série que nasce de uma edição em 28/02 segue no 31.
            $table->unsignedTinyInteger('anchor_day')->nullable();
            $table->date('ends_on')->nullable();
            $table->unsignedSmallInteger('installments_total')->nullable();
            $table->date('generated_until')->nullable();
            // A data da próxima ocorrência ainda não criada; nula quando a repetição acabou.
            $table->date('next_occurrence_on')->nullable();

            // Dados-modelo do lançamento. No parcelamento, o valor e a taxa são os totais digitados;
            // na recorrência, os de cada ocorrência.
            $table->string('type', 20);
            $table->foreignId('financial_category_id')->constrained('clinic_financial_categories')->restrictOnDelete();
            $table->string('payment_method', 30);
            $table->string('description', 255);
            $table->decimal('gross_amount', 14, 2);
            $table->decimal('fee_amount', 14, 2)->default(0);
            $table->text('notes')->nullable();
            // Id do módulo Patient, sem FK entre módulos.
            $table->unsignedBigInteger('patient_id')->nullable();
            $table->foreignId('created_by_user_id')->constrained('clinic_users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['clinic_id', 'kind']);
            // O comando diário só busca as que têm ocorrência antes do horizonte.
            $table->index(['kind', 'next_occurrence_on']);
            // O Postgres não indexa a FK sozinho: a conferência de categoria em uso (e o
            // restrictOnDelete) varreria a tabela inteira.
            $table->index('financial_category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_financial_series');
    }
};
