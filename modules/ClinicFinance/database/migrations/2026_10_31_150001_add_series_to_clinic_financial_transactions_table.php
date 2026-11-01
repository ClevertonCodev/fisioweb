<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_financial_transactions', function (Blueprint $table) {
            $table->foreignId('series_id')->nullable()->after('financial_category_id')
                ->constrained('clinic_financial_series')->nullOnDelete();
            $table->unsignedSmallInteger('series_index')->nullable()->after('series_id');

            // Uma parcela/ocorrência por posição: é o que deixa a geração idempotente.
            $table->unique(['series_id', 'series_index']);
        });
    }

    public function down(): void
    {
        Schema::table('clinic_financial_transactions', function (Blueprint $table) {
            $table->dropUnique(['series_id', 'series_index']);
            $table->dropConstrainedForeignId('series_id');
            $table->dropColumn('series_index');
        });
    }
};
