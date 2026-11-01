<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Comprovantes do lançamento (tarefa 014). O arquivo fica no R2 numa pasta da
 * clínica e só abre por link assinado; por isso não há `cdn_url` aqui.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_financial_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('financial_transaction_id')->constrained('clinic_financial_transactions')->cascadeOnDelete();
            $table->string('path', 500);
            $table->string('original_name', 255);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size');
            $table->foreignId('uploaded_by_user_id')->nullable()->constrained('clinic_users')->nullOnDelete();
            $table->timestamps();

            $table->index(['clinic_id', 'financial_transaction_id']);
            // A contagem por lançamento (withCount na listagem) e o cascade da FK no Postgres.
            $table->index('financial_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_financial_attachments');
    }
};
