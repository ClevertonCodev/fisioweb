<?php

use Illuminate\Support\Facades\Route;
use Modules\Clinic\Http\Controllers\TreatmentPlanController;

Route::clinic(function () {
    Route::prefix('treatment-plans')->name('treatment-plans.')->group(function () {
        Route::get('/', [TreatmentPlanController::class, 'index'])->name('index');
        Route::get('/create', [TreatmentPlanController::class, 'create'])->name('create');
        Route::post('/', [TreatmentPlanController::class, 'store'])->name('store');
        Route::get('/{id}', [TreatmentPlanController::class, 'show'])->name('show');
        Route::get('/{id}/edit', [TreatmentPlanController::class, 'edit'])->name('edit');
        Route::put('/{id}', [TreatmentPlanController::class, 'update'])->name('update');
        Route::delete('/{id}', [TreatmentPlanController::class, 'destroy'])->name('destroy');
        Route::post('/{id}/duplicate', [TreatmentPlanController::class, 'duplicate'])->name('duplicate');
        Route::get('/{id}/pdf', [TreatmentPlanController::class, 'downloadPdf'])->name('pdf');
    });

    Route::post('exercises/{exerciseId}/toggle-favorite', [TreatmentPlanController::class, 'toggleFavorite'])
        ->name('exercises.toggle-favorite');
});
