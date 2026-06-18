<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role', 50)->default('physiotherapist');
            $table->tinyInteger('mestre')->default(0);
            $table->string('document', 30)->nullable();
            $table->string('photo_url')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->rememberToken();
            $table->string('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();

            // Integração Google Calendar (conexão OAuth individual por usuário)
            $table->text('google_access_token')->nullable();
            $table->text('google_refresh_token')->nullable();
            $table->timestamp('google_token_expires_at')->nullable();
            $table->string('google_calendar_id')->nullable();
            $table->text('google_sync_token')->nullable();
            $table->timestamp('google_connected_at')->nullable();

            $table->timestamps();

            $table->index(['clinic_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_users');
    }
};
