<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\VideoController;

Route::prefix('api/videos')->middleware(['web', 'auth:web'])->group(function () {
    Route::get('/', [VideoController::class, 'index'])->name('media.videos.index');
    Route::get('/upload-mode', [VideoController::class, 'uploadMode'])->name('media.videos.upload-mode');
    Route::post('/upload', [VideoController::class, 'upload'])->name('media.videos.upload');
    Route::post('/upload-multiple', [VideoController::class, 'uploadMultiple'])->name('media.videos.upload-multiple');
    Route::post('/presigned-upload-request', [VideoController::class, 'requestPresignedUploadUrl'])->name('media.videos.presigned-upload-request');
    Route::post('/{video}/confirm-upload', [VideoController::class, 'confirmUpload'])->name('media.videos.confirm-upload');
    Route::get('/{video}', [VideoController::class, 'show'])->name('media.videos.show');
    Route::delete('/{video}', [VideoController::class, 'destroy'])->name('media.videos.destroy');
    Route::patch('/{video}/metadata', [VideoController::class, 'updateMetadata'])->name('media.videos.update-metadata');
});

require __DIR__.'/video.php';
