<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('treatment_plans', function (Blueprint $table) {
            $table->timestamp('patient_viewed_at')->nullable()->after('status');
            $table->unsignedSmallInteger('patient_completed_count')->default(0)->after('patient_viewed_at');
        });
    }

    public function down(): void
    {
        Schema::table('treatment_plans', function (Blueprint $table) {
            $table->dropColumn(['patient_viewed_at', 'patient_completed_count']);
        });
    }
};
