<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_patient_files', function (Blueprint $table) {
            $table->string('name')->nullable()->after('original_name');
        });
    }

    public function down(): void
    {
        Schema::table('clinic_patient_files', function (Blueprint $table) {
            $table->dropColumn('name');
        });
    }
};
