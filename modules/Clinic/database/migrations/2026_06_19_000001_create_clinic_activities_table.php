<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('clinic_user_id')->nullable()->constrained('clinic_users')->nullOnDelete();
            $table->string('type', 40);
            $table->string('description', 255);
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->timestamps();

            $table->index(['clinic_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_activities');
    }
};
