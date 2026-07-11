<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Http\Controllers\AdminProgramController;
use Modules\Admin\Http\Controllers\DashboardController;
use Modules\Admin\Http\Controllers\ExerciseController;
use Modules\Admin\Http\Controllers\ExerciseReviewController;
use Modules\Admin\Http\Controllers\FeatureController;
use Modules\Admin\Http\Controllers\FeaturePlanController;
use Modules\Admin\Http\Controllers\PlanController;

Route::prefix('admin')->middleware('auth:admin')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');

    Route::prefix('plans')->name('admin.plans.')->group(function () {
        Route::get('/', [PlanController::class, 'index'])->name('index');
        Route::get('{id}', [PlanController::class, 'show'])->name('show');
        Route::post('/', [PlanController::class, 'store'])->name('store');
        Route::put('{id}', [PlanController::class, 'update'])->name('update');
        Route::delete('{id}', [PlanController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('features')->name('admin.features.')->group(function () {
        Route::get('/', [FeatureController::class, 'index'])->name('index');
        Route::get('create-options', [FeatureController::class, 'createOptions'])->name('create-options');
        Route::get('{id}', [FeatureController::class, 'show'])->name('show');
        Route::post('/', [FeatureController::class, 'store'])->name('store');
        Route::put('{id}', [FeatureController::class, 'update'])->name('update');
        Route::delete('{id}', [FeatureController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('feature-plans')->name('admin.feature-plans.')->group(function () {
        Route::get('/', [FeaturePlanController::class, 'index'])->name('index');
        Route::post('/', [FeaturePlanController::class, 'store'])->name('store');
        Route::delete('{id}', [FeaturePlanController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('exercises')->name('admin.exercises.')->group(function () {
        Route::get('/', [ExerciseController::class, 'index'])->name('index');
        Route::get('options', [ExerciseController::class, 'options'])->name('options');
        Route::get('pending-count', [ExerciseReviewController::class, 'pendingCount'])->name('pending-count');
        Route::put('{id}/approve', [ExerciseReviewController::class, 'approve'])->name('approve');
        Route::put('{id}/reject', [ExerciseReviewController::class, 'reject'])->name('reject');
        Route::get('{id}', [ExerciseController::class, 'show'])->name('show');
        Route::post('/', [ExerciseController::class, 'store'])->name('store');
        Route::put('{id}', [ExerciseController::class, 'update'])->name('update');
        Route::delete('{id}', [ExerciseController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('programs')->name('admin.programs.')->group(function () {
        Route::get('/', [AdminProgramController::class, 'index'])->name('index');
        Route::post('/', [AdminProgramController::class, 'store'])->name('store');
        Route::get('{id}/detail', [AdminProgramController::class, 'detail'])->name('detail');
        Route::get('{id}', [AdminProgramController::class, 'show'])->name('show');
        Route::put('{id}', [AdminProgramController::class, 'update'])->name('update');
        Route::delete('{id}', [AdminProgramController::class, 'destroy'])->name('destroy');
    });
});
