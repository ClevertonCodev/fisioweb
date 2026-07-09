<?php

use Illuminate\Support\Facades\Route;
use Modules\Clinic\Http\Controllers\ClinicProfileController;
use Modules\Clinic\Http\Controllers\ClinicUserController;
use Modules\Clinic\Http\Controllers\DashboardController;
use Modules\Clinic\Http\Controllers\ExerciseController;
use Modules\Clinic\Http\Controllers\PatientController;

Route::prefix('clinic')->middleware(['auth:clinic', 'clinic.guard'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('clinic.dashboard');
    Route::get('dashboard/occupancy-rate', [DashboardController::class, 'occupancyRate'])->name('clinic.dashboard.occupancy-rate');
    Route::get('dashboard/patient-acquisition', [DashboardController::class, 'patientAcquisition'])->name('clinic.dashboard.patient-acquisition');
    Route::get('dashboard/activities', [DashboardController::class, 'activities'])->name('clinic.dashboard.activities');

    Route::get('profile', [ClinicProfileController::class, 'show'])->name('clinic.profile.show');
    Route::put('profile', [ClinicProfileController::class, 'update'])->name('clinic.profile.update');

    Route::get('users/professionals', [ClinicUserController::class, 'professionals'])->name('clinic.users.professionals');
    Route::post('users/{user}/photo', [ClinicUserController::class, 'uploadPhoto'])->name('clinic.users.upload-photo');
    Route::delete('users/{user}/photo', [ClinicUserController::class, 'deletePhoto'])->name('clinic.users.delete-photo');
    Route::apiResource('users', ClinicUserController::class)->names('clinic.users');

    Route::prefix('patients')->name('clinic.patients.')->group(function () {
        Route::get('/', [PatientController::class, 'index'])->name('index');
        Route::post('bulk-inactivate', [PatientController::class, 'bulkInactivate'])->name('bulk-inactivate');
        Route::get('{id}', [PatientController::class, 'show'])->name('show');
        Route::post('/', [PatientController::class, 'store'])->name('store');
        Route::put('{id}', [PatientController::class, 'update'])->name('update');
        Route::post('{id}/photo', [PatientController::class, 'uploadPhoto'])->name('upload-photo');
        Route::delete('{id}/photo', [PatientController::class, 'deletePhoto'])->name('delete-photo');
        Route::delete('{id}', [PatientController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('exercises')->name('clinic.exercises.')->group(function () {
        Route::get('/', [ExerciseController::class, 'index'])->name('index');
        Route::get('options', [ExerciseController::class, 'options'])->name('options');
        Route::post('/', [ExerciseController::class, 'store'])->name('store');
        Route::post('{id}/favorite', [ExerciseController::class, 'toggleFavorite'])->name('favorite');
    });

    Route::get('favorites', [ExerciseController::class, 'favorites'])->name('clinic.favorites');
});
