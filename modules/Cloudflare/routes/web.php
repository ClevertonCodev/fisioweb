<?php

use Illuminate\Support\Facades\Route;
use Modules\Cloudflare\Http\Controllers\VideoController;

/*
|--------------------------------------------------------------------------
| Cloudflare Module Routes
|--------------------------------------------------------------------------
|
| Routes for video upload and management using Cloudflare R2 + CDN
|
*/

Route::prefix('api/videos')->middleware(['auth:sanctum'])->group(function () {
    // Video upload routes
    Route::post('/upload', [VideoController::class, 'upload'])->name('videos.upload');
    Route::post('/upload-multiple', [VideoController::class, 'uploadMultiple'])->name('videos.upload-multiple');

    // Video management routes
    Route::get('/', [VideoController::class, 'index'])->name('videos.index');
    Route::get('/{id}', [VideoController::class, 'show'])->name('videos.show');
    Route::delete('/{id}', [VideoController::class, 'destroy'])->name('videos.destroy');
    Route::patch('/{id}/metadata', [VideoController::class, 'updateMetadata'])->name('videos.update-metadata');
});
