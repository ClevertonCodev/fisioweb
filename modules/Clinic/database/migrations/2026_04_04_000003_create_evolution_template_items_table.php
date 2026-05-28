<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evolution_template_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evolution_template_section_id')->constrained('evolution_template_sections')->cascadeOnDelete();
            $table->string('label');
            $table->text('print_text');
            $table->boolean('has_free_text')->default(false);
            $table->string('free_text_placeholder')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evolution_template_items');
    }
};
