<?php

use Illuminate\Support\Facades\Route;
use Modules\ClinicQuestionnaire\Http\Controllers\QuestionnaireAnswerController;

Route::prefix('questionnaires')->name('questionnaires.')->group(function () {
    Route::get('{id}', [QuestionnaireAnswerController::class, 'show'])->name('show');
    Route::post('{id}/answer', [QuestionnaireAnswerController::class, 'store'])->name('answer');
});
