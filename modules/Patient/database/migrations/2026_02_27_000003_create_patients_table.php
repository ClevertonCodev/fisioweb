<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('cpf', 14)->nullable();
            $table->string('phone', 20)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender', 20)->nullable();
            $table->string('biological_sex', 20)->nullable();
            $table->string('marital_status', 50)->nullable();
            $table->string('education', 100)->nullable();
            $table->string('profession', 100)->nullable();
            $table->string('emergency_contact')->nullable();
            $table->string('caregiver_contact')->nullable();
            $table->string('insurance', 100)->nullable();
            $table->string('insurance_number', 50)->nullable();
            $table->string('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 2)->nullable();
            $table->string('zip_code', 10)->nullable();
            $table->string('referral_source', 100)->nullable();
            $table->string('apelido', 100)->nullable();
            $table->boolean('use_apelido')->default(false);
            $table->boolean('is_foreign')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('status', 50)->nullable();
            $table->string('photo_url')->nullable();
            $table->string('password');
            $table->timestamps();
            $table->softDeletes();

            // email e cpf únicos por clínica
            $table->unique(['email', 'clinic_id']);
            $table->unique(['cpf', 'clinic_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
