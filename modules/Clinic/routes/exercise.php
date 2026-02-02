<?php

use Illuminate\Support\Facades\Route;
use Modules\Clinic\Http\Controllers\ExerciseController;

Route::clinic(function () {
    Route::get('exercises', [ExerciseController::class, 'index'])->name('exercises');
});
