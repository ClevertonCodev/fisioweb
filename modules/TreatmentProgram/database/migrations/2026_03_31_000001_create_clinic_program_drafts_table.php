<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_program_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('clinic_user_id')->constrained('clinic_users')->cascadeOnDelete();
            $table->json('draft_data');
            $table->timestamps();

            $table->unique('clinic_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_program_drafts');
    }
};
