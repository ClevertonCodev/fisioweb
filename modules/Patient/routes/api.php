<?php

use Illuminate\Support\Facades\Route;
use Modules\Patient\Http\Controllers\AuthController;

Route::prefix('patient/auth')->group(function () {
    Route::post('find-clinics', [AuthController::class, 'findClinics'])
        ->middleware('throttle:patient-find-clinics');

    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:patient')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });
});
