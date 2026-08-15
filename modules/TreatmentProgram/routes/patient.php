<?php

use Illuminate\Support\Facades\Route;
use Modules\TreatmentProgram\Http\Controllers\Patient\PatientProgramController;

Route::prefix('patient/programs')->name('patient.programs.')->group(function () {
    Route::middleware('auth:patient')->group(function () {
        Route::get('/', [PatientProgramController::class, 'index'])->name('index');
    });

    Route::get('{publicToken}', [PatientProgramController::class, 'show'])->name('show');
    Route::post('{publicToken}/view', [PatientProgramController::class, 'view'])->name('view');
    Route::post('{publicToken}/executions', [PatientProgramController::class, 'startExecution'])->name('executions.start');
    Route::post('{publicToken}/executions/{executionId}/series', [PatientProgramController::class, 'saveSeries'])->name('executions.series');
    Route::patch('{publicToken}/executions/{executionId}', [PatientProgramController::class, 'updateUnfinished'])->name('executions.update');
    Route::post('{publicToken}/feedback', [PatientProgramController::class, 'feedback'])->name('feedback');
    Route::post('{publicToken}/complete', [PatientProgramController::class, 'complete'])->name('complete');
});
