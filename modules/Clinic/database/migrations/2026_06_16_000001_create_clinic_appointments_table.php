<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('patient_id')->nullable()->constrained('patients')->nullOnDelete();
            $table->foreignId('clinic_user_id')->constrained('clinic_users')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->string('status', 20)->default('scheduled');
            $table->string('google_event_id')->nullable();
            $table->string('source', 20)->default('system');
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->index(['clinic_id', 'starts_at']);
            $table->index(['clinic_user_id', 'starts_at']);
            $table->index(['clinic_id', 'status']);
            $table->index('google_event_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_appointments');
    }
};
