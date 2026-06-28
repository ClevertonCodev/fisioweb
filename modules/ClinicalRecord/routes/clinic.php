<?php

use Illuminate\Support\Facades\Route;
use Modules\ClinicalRecord\Http\Controllers\AssessmentController;
use Modules\ClinicalRecord\Http\Controllers\EvolutionController;
use Modules\ClinicalRecord\Http\Controllers\EvolutionTemplateController;
use Modules\ClinicalRecord\Http\Controllers\PatientFileController;
use Modules\ClinicalRecord\Http\Controllers\SharedAssessmentTemplateController;

Route::prefix('clinic')->middleware(['auth:clinic', 'clinic.guard'])->group(function () {
    Route::prefix('patients')->name('clinic.patients.')->group(function () {
        Route::get('{patient}/assessments', [AssessmentController::class, 'indexByPatient'])->name('assessments.index');
        Route::post('{patient}/assessments', [AssessmentController::class, 'storeForPatient'])->name('assessments.store');
        Route::get('{patient}/evolutions', [EvolutionController::class, 'indexByPatient'])->name('evolutions.index');
        Route::post('{patient}/evolutions', [EvolutionController::class, 'storeForPatient'])->name('evolutions.store');
        Route::get('{patient}/files', [PatientFileController::class, 'index'])->name('files.index');
        Route::post('{patient}/files', [PatientFileController::class, 'store'])->name('files.store');
        Route::delete('{patient}/files/{file}', [PatientFileController::class, 'destroy'])->name('files.destroy');
    });

    Route::prefix('assessments')->name('clinic.assessments.')->group(function () {
        Route::get('{id}', [AssessmentController::class, 'show'])->name('show');
        Route::put('{id}', [AssessmentController::class, 'update'])->name('update');
        Route::post('{id}/sign', [AssessmentController::class, 'sign'])->name('sign');
        Route::delete('{id}', [AssessmentController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('evolutions')->name('clinic.evolutions.')->group(function () {
        Route::get('{id}', [EvolutionController::class, 'show'])->name('show');
        Route::put('{id}', [EvolutionController::class, 'update'])->name('update');
        Route::post('{id}/generate-text', [EvolutionController::class, 'generateText'])->name('generate-text');
        Route::post('{id}/sign', [EvolutionController::class, 'sign'])->name('sign');
        Route::get('{id}/pdf', [EvolutionController::class, 'downloadPdf'])->name('pdf');
        Route::delete('{id}', [EvolutionController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('evolution-templates')->name('clinic.evolution-templates.')->group(function () {
        Route::get('/', [EvolutionTemplateController::class, 'index'])->name('index');
        Route::post('/', [EvolutionTemplateController::class, 'store'])->name('store');
        Route::get('{id}', [EvolutionTemplateController::class, 'show'])->name('show');
        Route::put('{id}', [EvolutionTemplateController::class, 'update'])->name('update');
        Route::delete('{id}', [EvolutionTemplateController::class, 'destroy'])->name('destroy');
    });

    Route::get('assessment-templates', [SharedAssessmentTemplateController::class, 'index'])->name('clinic.assessment-templates.index');
    Route::get('assessment-templates/{id}', [SharedAssessmentTemplateController::class, 'show'])->name('clinic.assessment-templates.show');
});
