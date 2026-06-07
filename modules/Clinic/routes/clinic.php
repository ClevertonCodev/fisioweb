<?php

use Illuminate\Support\Facades\Route;
use Modules\Clinic\Http\Controllers\AssessmentController;
use Modules\Clinic\Http\Controllers\ClinicUserController;
use Modules\Clinic\Http\Controllers\EvolutionController;
use Modules\Clinic\Http\Controllers\EvolutionTemplateController;
use Modules\Clinic\Http\Controllers\DashboardController;
use Modules\Clinic\Http\Controllers\ExerciseController;
use Modules\Clinic\Http\Controllers\PatientController;
use Modules\Clinic\Http\Controllers\PatientFileController;
use Modules\Clinic\Http\Controllers\PatientQuestionnaireController;
use Modules\Clinic\Http\Controllers\QuestionnaireAnswerController;
use Modules\Clinic\Http\Controllers\QuestionnaireTemplateController;
use Modules\Clinic\Http\Controllers\ProgramDraftController;
use Modules\Clinic\Http\Controllers\SharedAssessmentTemplateController;
use Modules\Clinic\Http\Controllers\SharedProgramController;
use Modules\Clinic\Http\Controllers\TreatmentPlanController;

Route::prefix('clinic')->middleware(['auth:clinic', 'clinic.guard'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('clinic.dashboard');

    Route::get('users/professionals', [ClinicUserController::class, 'professionals'])->name('clinic.users.professionals');
    Route::apiResource('users', ClinicUserController::class)->names('clinic.users');

    Route::prefix('patients')->name('clinic.patients.')->group(function () {
        Route::get('/', [PatientController::class, 'index'])->name('index');
        Route::post('bulk-inactivate', [PatientController::class, 'bulkInactivate'])->name('bulk-inactivate');
        Route::get('{patient}/assessments', [AssessmentController::class, 'indexByPatient'])->name('assessments.index');
        Route::post('{patient}/assessments', [AssessmentController::class, 'storeForPatient'])->name('assessments.store');
        Route::get('{patient}/evolutions', [EvolutionController::class, 'indexByPatient'])->name('evolutions.index');
        Route::post('{patient}/evolutions', [EvolutionController::class, 'storeForPatient'])->name('evolutions.store');
        Route::get('{patient}/files', [PatientFileController::class, 'index'])->name('files.index');
        Route::post('{patient}/files', [PatientFileController::class, 'store'])->name('files.store');
        Route::delete('{patient}/files/{file}', [PatientFileController::class, 'destroy'])->name('files.destroy');
        Route::get('{patient}/questionnaires', [PatientQuestionnaireController::class, 'indexByPatient'])->name('questionnaires.index');
        Route::post('{patient}/questionnaires', [PatientQuestionnaireController::class, 'storeForPatient'])->name('questionnaires.store');
        Route::get('{patient}/questionnaires/{questionnaire}', [PatientQuestionnaireController::class, 'show'])->name('questionnaires.show');
        Route::delete('{patient}/questionnaires/{questionnaire}', [PatientQuestionnaireController::class, 'destroy'])->name('questionnaires.destroy');
        Route::get('{id}', [PatientController::class, 'show'])->name('show');
        Route::post('/', [PatientController::class, 'store'])->name('store');
        Route::put('{id}', [PatientController::class, 'update'])->name('update');
        Route::post('{id}/photo', [PatientController::class, 'uploadPhoto'])->name('upload-photo');
        Route::delete('{id}', [PatientController::class, 'destroy'])->name('destroy');
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

    Route::prefix('exercises')->name('clinic.exercises.')->group(function () {
        Route::get('/', [ExerciseController::class, 'index'])->name('index');
        Route::post('{id}/favorite', [ExerciseController::class, 'toggleFavorite'])->name('favorite');
    });

    Route::get('favorites', [ExerciseController::class, 'favorites'])->name('clinic.favorites');

    Route::prefix('program-drafts')->name('clinic.program-drafts.')->group(function () {
        Route::get('/', [ProgramDraftController::class, 'show'])->name('show');
        Route::put('/', [ProgramDraftController::class, 'upsert'])->name('upsert');
        Route::delete('/', [ProgramDraftController::class, 'destroy'])->name('destroy');
    });

    Route::get('programs', [SharedProgramController::class, 'index'])->name('clinic.programs.index');
    Route::get('programs/{id}', [SharedProgramController::class, 'show'])->name('clinic.programs.show');

    Route::get('assessment-templates', [SharedAssessmentTemplateController::class, 'index'])->name('clinic.assessment-templates.index');
    Route::get('assessment-templates/{id}', [SharedAssessmentTemplateController::class, 'show'])->name('clinic.assessment-templates.show');

    Route::prefix('questionnaire-templates')->name('clinic.questionnaire-templates.')->group(function () {
        Route::get('/', [QuestionnaireTemplateController::class, 'index'])->name('index');
        Route::post('/', [QuestionnaireTemplateController::class, 'store'])->name('store');
        Route::get('{id}', [QuestionnaireTemplateController::class, 'show'])->name('show');
        Route::put('{id}', [QuestionnaireTemplateController::class, 'update'])->name('update');
        Route::delete('{id}', [QuestionnaireTemplateController::class, 'destroy'])->name('destroy');
    });
});

// Rotas públicas para o paciente responder o questionário (sem auth de clínica)
Route::prefix('questionnaires')->name('questionnaires.')->group(function () {
    Route::get('{id}', [QuestionnaireAnswerController::class, 'show'])->name('show');
    Route::post('{id}/answer', [QuestionnaireAnswerController::class, 'store'])->name('answer');
});
