<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type_charge');
            $table->decimal('value_month', 10, 2);
            $table->decimal('value_year', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_plans');
    }
};
