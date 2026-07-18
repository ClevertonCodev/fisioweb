<?php

use Illuminate\Support\Facades\Route;
use Modules\ClinicQuestionnaire\Http\Controllers\PatientQuestionnaireController;
use Modules\ClinicQuestionnaire\Http\Controllers\QuestionnaireTemplateController;

Route::prefix('clinic')->middleware(['auth:clinic', 'clinic.guard'])->group(function () {
    Route::prefix('patients')->name('clinic.patients.')->group(function () {
        Route::get('{patient}/questionnaires', [PatientQuestionnaireController::class, 'indexByPatient'])->name('questionnaires.index');
        Route::post('{patient}/questionnaires', [PatientQuestionnaireController::class, 'storeForPatient'])->name('questionnaires.store');
        Route::get('{patient}/questionnaires/{questionnaire}', [PatientQuestionnaireController::class, 'show'])->name('questionnaires.show');
        Route::post('{patient}/questionnaires/{questionnaire}/answer', [PatientQuestionnaireController::class, 'answer'])->name('questionnaires.answer');
        Route::delete('{patient}/questionnaires/{questionnaire}', [PatientQuestionnaireController::class, 'destroy'])->name('questionnaires.destroy');
    });

    Route::prefix('questionnaire-templates')->name('clinic.questionnaire-templates.')->group(function () {
        Route::get('/', [QuestionnaireTemplateController::class, 'index'])->name('index');
        Route::post('/', [QuestionnaireTemplateController::class, 'store'])->name('store');
        Route::get('{id}', [QuestionnaireTemplateController::class, 'show'])->name('show');
        Route::put('{id}', [QuestionnaireTemplateController::class, 'update'])->name('update');
        Route::delete('{id}', [QuestionnaireTemplateController::class, 'destroy'])->name('destroy');
    });
});
