<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Http\Controllers\VideosController;

Route::admin(function () {
    Route::get('videos', [VideosController::class, 'upload'])->name('videos.upload');
});
