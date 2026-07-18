<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_feature_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('admin_plans')->cascadeOnDelete();
            $table->foreignId('feature_id')->constrained('admin_features')->cascadeOnDelete();
            $table->boolean('value')->default(true);
            $table->timestamps();

            $table->unique(['plan_id', 'feature_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_feature_plans');
    }
};
