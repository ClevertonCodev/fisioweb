<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinics', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('document', 30)->nullable();
            $table->string('type_person', 10)->default('juridica');
            $table->tinyInteger('status')->default(1);
            $table->string('email')->unique();
            $table->string('phone', 30)->nullable();
            $table->string('slug')->unique()->nullable();
            $table->string('zip_code', 10)->nullable();
            $table->string('address')->nullable();
            $table->string('number', 20)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 2)->nullable();
            $table->string('timezone', 64)->default('America/Sao_Paulo');
            // Janela de atendimento — denominador da Taxa de ocupação (FR-019a).
            $table->time('working_start')->default('08:00:00');
            $table->time('working_end')->default('18:00:00');
            $table->json('working_days')->nullable(); // dias ISO atendidos (1=seg … 7=dom)
            $table->foreignId('plan_id')->nullable()->constrained('admin_plans')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinics');
    }
};
