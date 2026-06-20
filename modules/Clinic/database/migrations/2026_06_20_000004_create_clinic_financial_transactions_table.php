<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('financial_category_id')->constrained('clinic_financial_categories')->restrictOnDelete();
            $table->string('type', 20);
            $table->string('status', 20);
            $table->string('payment_method', 30);
            $table->date('date');
            $table->string('description', 255);
            $table->decimal('gross_amount', 14, 2);
            $table->decimal('fee_amount', 14, 2)->default(0);
            $table->decimal('net_amount', 14, 2);
            $table->text('notes')->nullable();
            $table->foreignId('created_by_user_id')->constrained('clinic_users')->restrictOnDelete();
            $table->foreignId('deleted_by_user_id')->nullable()->constrained('clinic_users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['clinic_id', 'date']);
            $table->index(['clinic_id', 'type', 'status']);
            $table->index(['clinic_id', 'financial_category_id']);
            $table->index(['clinic_id', 'deleted_at']);
            $table->index(['clinic_id', 'payment_method']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_financial_transactions');
    }
};
