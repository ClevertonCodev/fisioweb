<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media_videos', function (Blueprint $table) {
            $table->dropColumn(['url', 'cdn_url', 'thumbnail_url']);
        });
    }

    public function down(): void
    {
        Schema::table('media_videos', function (Blueprint $table) {
            $table->text('url')->nullable();
            $table->text('cdn_url')->nullable();
            $table->text('thumbnail_url')->nullable();
        });
    }
};
