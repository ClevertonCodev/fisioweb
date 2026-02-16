<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Http\Controllers\ExercisesController;

Route::admin(function () {
    Route::get('exercises', [ExercisesController::class, 'index'])->name('exercises.index');
    Route::get('exercises/create', [ExercisesController::class, 'create'])->name('exercises.create');
    Route::post('exercises', [ExercisesController::class, 'store'])->name('exercises.store');
    Route::get('exercises/{exercise}', [ExercisesController::class, 'show'])->name('exercises.show');
    Route::get('exercises/{exercise}/edit', [ExercisesController::class, 'edit'])->name('exercises.edit');
    Route::put('exercises/{exercise}', [ExercisesController::class, 'update'])->name('exercises.update');
    Route::delete('exercises/{exercise}', [ExercisesController::class, 'destroy'])->name('exercises.destroy');

    // Media (imagens, gifs, áudio)
    Route::post('exercises/{exercise}/media', [ExercisesController::class, 'uploadMedia'])->name('exercises.media.upload');
    Route::delete('exercises/{exercise}/media/{media}', [ExercisesController::class, 'destroyMedia'])->name('exercises.media.destroy');
});
