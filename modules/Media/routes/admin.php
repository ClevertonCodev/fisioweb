<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\VideoController;

Route::prefix('admin/media')->middleware('auth:admin')->group(function () {
    Route::get('videos', [VideoController::class, 'index'])->name('media.admin.videos.index');
    Route::get('videos/{video}', [VideoController::class, 'show'])->name('media.admin.videos.show');
    Route::post('videos/presigned-upload-request', [VideoController::class, 'requestPresignedUploadUrl'])->name('media.admin.videos.presigned-upload-request');
    Route::post('videos/{video}/presigned-thumbnail-request', [VideoController::class, 'requestPresignedThumbnailUrl'])->name('media.admin.videos.presigned-thumbnail-request');
    Route::post('videos/{video}/presigned-thumbnail-replace-request', [VideoController::class, 'requestPresignedThumbnailReplaceUrl'])->name('media.admin.videos.presigned-thumbnail-replace-request');
    Route::post('videos/{video}/confirm-upload', [VideoController::class, 'confirmUpload'])->name('media.admin.videos.confirm-upload');
    Route::patch('videos/{video}', [VideoController::class, 'update'])->name('media.admin.videos.update');
    Route::patch('videos/{video}/metadata', [VideoController::class, 'updateMetadata'])->name('media.admin.videos.update-metadata');
    Route::put('videos/{video}/reference-images', [VideoController::class, 'syncReferenceImages'])->name('media.admin.videos.reference-images');
    Route::delete('videos/{video}', [VideoController::class, 'destroy'])->name('media.admin.videos.destroy');
});
