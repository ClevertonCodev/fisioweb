<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_body_regions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('parent_id')->nullable()->constrained('admin_body_regions')->nullOnDelete();
            $table->timestamps();

            $table->unique(['parent_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_body_regions');
    }
};
