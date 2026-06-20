<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_financial_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->nullable()->constrained('clinics')->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('type', 20);
            $table->string('origin', 20)->default('system');
            $table->boolean('active')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->index(['clinic_id', 'type', 'active']);
            $table->index(['origin', 'type']);
            $table->unique(['clinic_id', 'name', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_financial_categories');
    }
};
