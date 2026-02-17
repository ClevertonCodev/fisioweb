<?php

use Illuminate\Support\Facades\Route;
use Modules\Clinic\Http\Controllers\ExerciseController;

Route::clinic(function () {
    Route::get('exercises', [ExerciseController::class, 'index'])->name('exercises');
    Route::get('exercises/search', [ExerciseController::class, 'search'])->name('exercises.search');
});
