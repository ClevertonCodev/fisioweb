<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_patient_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('clinic_user_id')->nullable()->constrained('clinic_users')->nullOnDelete();
            $table->string('original_name');
            $table->string('file_path');
            $table->string('cdn_url');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['clinic_id', 'patient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_patient_files');
    }
};
