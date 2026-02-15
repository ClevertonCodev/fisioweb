<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\VideoController;

Route::admin(function () {
    Route::get('videos', [VideoController::class, 'page'])->name('media.videos.page');
    Route::get('videos/create', [VideoController::class, 'create'])->name('media.videos.create');
    Route::get('videos/{video}/edit', [VideoController::class, 'edit'])->name('media.videos.edit');
    Route::post('videos/presigned-upload-request', [VideoController::class, 'requestPresignedUploadUrl'])->name('media.videos.presigned-upload-request');
    Route::post('videos/{video}/presigned-thumbnail-request', [VideoController::class, 'requestPresignedThumbnailUrl'])->name('media.videos.presigned-thumbnail-request');
    Route::post('videos/{video}/confirm-upload', [VideoController::class, 'confirmUpload'])->name('media.videos.confirm-upload');
    Route::post('videos/{video}/presigned-thumbnail-replace-request', [VideoController::class, 'requestPresignedThumbnailReplaceUrl'])->name('media.videos.presigned-thumbnail-replace-request');
    Route::patch('videos/{video}', [VideoController::class, 'update'])->name('media.videos.update');
    Route::get('videos/api', [VideoController::class, 'index'])->name('media.videos.index');
    Route::post('videos/upload', [VideoController::class, 'upload'])->name('media.videos.upload');
    Route::post('videos/upload-multiple', [VideoController::class, 'uploadMultiple'])->name('media.videos.upload-multiple');
    Route::get('videos/{video}', [VideoController::class, 'show'])->name('media.videos.show');
    Route::delete('videos/{video}', [VideoController::class, 'destroy'])->name('media.videos.destroy');
    Route::patch('videos/{video}/metadata', [VideoController::class, 'updateMetadata'])->name('media.videos.update-metadata');
});
