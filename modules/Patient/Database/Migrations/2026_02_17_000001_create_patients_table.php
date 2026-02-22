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
            $table->string('name');
            $table->string('cpf', 14)->unique()->nullable();
            $table->string('gender')->nullable();
            $table->string('biological_sex')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('marital_status')->nullable();
            $table->string('education')->nullable();
            $table->string('profession')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->unique()->nullable();
            $table->string('password')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->string('caregiver_contact')->nullable();
            $table->string('insurance')->nullable();
            $table->string('insurance_number')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state', 2)->nullable();
            $table->string('zip_code', 10)->nullable();
            $table->string('referral_source')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('status')->default('em_tratamento');
            $table->rememberToken();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('clinic_patient', function (Blueprint $table) {
            $table->foreignId('clinic_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('registered_by')->nullable()->constrained('clinic_users')->nullOnDelete();
            $table->timestamps();

            $table->primary(['clinic_id', 'patient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_patient');
        Schema::dropIfExists('patients');
    }
};
