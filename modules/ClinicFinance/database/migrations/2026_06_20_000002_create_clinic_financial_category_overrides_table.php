<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_financial_category_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('financial_category_id')->constrained('clinic_financial_categories')->cascadeOnDelete();
            $table->boolean('active')->default(false);
            $table->timestamps();

            $table->unique(['clinic_id', 'financial_category_id'], 'clinic_fin_cat_override_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_financial_category_overrides');
    }
};
