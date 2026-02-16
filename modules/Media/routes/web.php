<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\VideoController;

if (! app()->isProduction()) {
    Route::prefix('api/videos')->group(function () {
        Route::get('/', [VideoController::class, 'index'])->name('media.videos.index');
        Route::post('/upload', [VideoController::class, 'upload'])->name('media.videos.upload');
        Route::post('/upload-multiple', [VideoController::class, 'uploadMultiple'])->name('media.videos.upload-multiple');
        Route::get('/{video}', [VideoController::class, 'show'])->name('media.videos.show');
        Route::delete('/{video}', [VideoController::class, 'destroy'])->name('media.videos.destroy');
        Route::patch('/{video}/metadata', [VideoController::class, 'updateMetadata'])->name('media.videos.update-metadata');
    });
}

require __DIR__ . '/video.php';
