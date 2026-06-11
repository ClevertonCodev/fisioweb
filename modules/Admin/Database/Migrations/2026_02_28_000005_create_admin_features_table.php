<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_features', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->decimal('value_isolated', 10, 2)->nullable();
            $table->string('type');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_features');
    }
};
