<?php

use Illuminate\Support\Facades\Route;
use Modules\TreatmentProgram\Http\Controllers\ProgramDraftController;
use Modules\TreatmentProgram\Http\Controllers\SharedProgramController;
use Modules\TreatmentProgram\Http\Controllers\TreatmentPlanController;

Route::prefix('clinic')->middleware(['auth:clinic', 'clinic.guard'])->group(function () {
    Route::prefix('treatment-plans')->name('clinic.treatment-plans.')->group(function () {
        Route::get('/', [TreatmentPlanController::class, 'index'])->name('index');
        Route::get('{id}/pdf', [TreatmentPlanController::class, 'downloadPdf'])->name('pdf');
        Route::get('{id}', [TreatmentPlanController::class, 'show'])->name('show');
        Route::post('/', [TreatmentPlanController::class, 'store'])->name('store');
        Route::put('{id}', [TreatmentPlanController::class, 'update'])->name('update');
        Route::delete('{id}', [TreatmentPlanController::class, 'destroy'])->name('destroy');
        Route::post('{id}/duplicate', [TreatmentPlanController::class, 'duplicate'])->name('duplicate');
        Route::post('{id}/to-model', [TreatmentPlanController::class, 'toModel'])->name('to-model');
    });

    Route::prefix('program-drafts')->name('clinic.program-drafts.')->group(function () {
        Route::get('/', [ProgramDraftController::class, 'show'])->name('show');
        Route::put('/', [ProgramDraftController::class, 'upsert'])->name('upsert');
        Route::delete('/', [ProgramDraftController::class, 'destroy'])->name('destroy');
    });

    Route::get('programs', [SharedProgramController::class, 'index'])->name('clinic.programs.index');
    Route::get('programs/{id}', [SharedProgramController::class, 'show'])->name('clinic.programs.show');
});
