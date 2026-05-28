<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\VideoController;

Route::prefix('patient/media')->middleware('auth:patient')->group(function () {
    Route::get('videos', [VideoController::class, 'index'])->name('media.patient.videos.index');
    Route::get('videos/{video}', [VideoController::class, 'show'])->name('media.patient.videos.show');
});
