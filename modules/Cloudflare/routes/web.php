<?php

use Illuminate\Support\Facades\Route;
use Modules\Cloudflare\Http\Controllers\VideoController;

// TODO: Restaurar middleware auth:sanctum após testes
Route::prefix('api/videos')->group(function () {
    Route::get('/', [VideoController::class, 'index'])->name('cloudflare.videos.index');
    Route::post('/upload', [VideoController::class, 'upload'])->name('cloudflare.videos.upload');
    Route::post('/upload-multiple', [VideoController::class, 'uploadMultiple'])->name('cloudflare.videos.upload-multiple');
    Route::get('/{video}', [VideoController::class, 'show'])->name('cloudflare.videos.show');
    Route::delete('/{video}', [VideoController::class, 'destroy'])->name('cloudflare.videos.destroy');
    Route::patch('/{video}/metadata', [VideoController::class, 'updateMetadata'])->name('cloudflare.videos.update-metadata');
});
