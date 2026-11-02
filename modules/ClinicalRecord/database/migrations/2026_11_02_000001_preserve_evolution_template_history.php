<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_evolution_templates', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('clinic_evolution_template_sections', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable();
        });

        Schema::table('clinic_evolution_template_items', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable();
        });

        Schema::table('clinic_patient_evolution_checked_items', function (Blueprint $table) {
            $table->dropForeign(['evolution_template_item_id']);
            $table->foreign('evolution_template_item_id')
                ->references('id')
                ->on('clinic_evolution_template_items')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('clinic_patient_evolution_checked_items', function (Blueprint $table) {
            $table->dropForeign(['evolution_template_item_id']);
            $table->foreign('evolution_template_item_id')
                ->references('id')
                ->on('clinic_evolution_template_items')
                ->cascadeOnDelete();
        });

        Schema::table('clinic_evolution_template_items', function (Blueprint $table) {
            $table->dropColumn('archived_at');
        });

        Schema::table('clinic_evolution_template_sections', function (Blueprint $table) {
            $table->dropColumn('archived_at');
        });

        Schema::table('clinic_evolution_templates', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
