<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\VideoController;

Route::prefix('clinic/media')->middleware('auth:clinic')->group(function () {
    Route::get('videos', [VideoController::class, 'index'])->name('media.clinic.videos.index');
    Route::get('videos/{video}', [VideoController::class, 'show'])->name('media.clinic.videos.show');
    Route::post('videos/presigned-upload-request', [VideoController::class, 'requestPresignedUploadUrl'])->name('media.clinic.videos.presigned-upload-request');
    Route::post('videos/{video}/presigned-thumbnail-request', [VideoController::class, 'requestPresignedThumbnailUrl'])->name('media.clinic.videos.presigned-thumbnail-request');
    Route::post('videos/{video}/presigned-thumbnail-replace-request', [VideoController::class, 'requestPresignedThumbnailReplaceUrl'])->name('media.clinic.videos.presigned-thumbnail-replace-request');
    Route::post('videos/{video}/confirm-upload', [VideoController::class, 'confirmUpload'])->name('media.clinic.videos.confirm-upload');
    Route::patch('videos/{video}', [VideoController::class, 'update'])->name('media.clinic.videos.update');
    Route::patch('videos/{video}/metadata', [VideoController::class, 'updateMetadata'])->name('media.clinic.videos.update-metadata');
    Route::put('videos/{video}/reference-images', [VideoController::class, 'syncReferenceImages'])->name('media.clinic.videos.reference-images');
    Route::delete('videos/{video}', [VideoController::class, 'destroy'])->name('media.clinic.videos.destroy');
});
