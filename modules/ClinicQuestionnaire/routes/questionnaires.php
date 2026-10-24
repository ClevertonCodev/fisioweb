<?php

use Illuminate\Support\Facades\Route;
use Modules\ClinicQuestionnaire\Http\Controllers\QuestionnaireAnswerController;

Route::prefix('questionnaires')->name('questionnaires.')->group(function () {
    Route::get('{token}', [QuestionnaireAnswerController::class, 'show'])->whereUuid('token')->name('show');
    Route::post('{token}/answer', [QuestionnaireAnswerController::class, 'store'])->whereUuid('token')->name('answer');
});
