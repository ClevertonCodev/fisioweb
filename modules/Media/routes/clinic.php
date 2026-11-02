<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\ClinicVideoController;

Route::prefix('clinic/media')->middleware(['auth:clinic', 'clinic.admin'])->group(function () {
    Route::post('videos/presigned-upload-request', [ClinicVideoController::class, 'requestPresignedUploadUrl'])->name('media.clinic.videos.presigned-upload-request');
    Route::post('videos/{video}/presigned-thumbnail-request', [ClinicVideoController::class, 'requestPresignedThumbnailUrl'])->name('media.clinic.videos.presigned-thumbnail-request');
    Route::post('videos/{video}/presigned-thumbnail-replace-request', [ClinicVideoController::class, 'requestPresignedThumbnailReplaceUrl'])->name('media.clinic.videos.presigned-thumbnail-replace-request');
    Route::post('videos/{video}/confirm-upload', [ClinicVideoController::class, 'confirmUpload'])->name('media.clinic.videos.confirm-upload');
    Route::put('videos/{video}/reference-images', [ClinicVideoController::class, 'syncReferenceImages'])->name('media.clinic.videos.reference-images');
});
