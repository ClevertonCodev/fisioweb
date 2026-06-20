<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_financial_opening_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->decimal('amount', 14, 2)->default(0);
            $table->foreignId('updated_by_user_id')->nullable()->constrained('clinic_users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['clinic_id', 'year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_financial_opening_balances');
    }
};
