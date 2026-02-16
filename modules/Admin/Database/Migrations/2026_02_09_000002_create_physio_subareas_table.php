<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('physio_subareas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('physio_area_id')->constrained('physio_areas')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->unique(['physio_area_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('physio_subareas');
    }
};
