<?php

use Illuminate\Database\Migrations\Migration;

// Tabela clinic_patient removida — paciente agora tem clinic_id direto na tabela patients.
return new class extends Migration
{
    public function up(): void {}

    public function down(): void {}
};
