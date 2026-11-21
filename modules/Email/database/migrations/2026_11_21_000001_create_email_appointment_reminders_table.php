<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `clinic_id` e `appointment_id` ficam sem chave estrangeira: as tabelas são de
 * outros módulos, e o `Email` não depende do esquema deles.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_appointment_reminders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('clinic_id');
            $table->unsignedBigInteger('appointment_id');
            $table->timestamp('starts_at');
            $table->timestamp('sent_at');

            $table->unique(['appointment_id', 'starts_at']);
            $table->index('clinic_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_appointment_reminders');
    }
};
