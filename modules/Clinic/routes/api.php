<?php

use Illuminate\Support\Facades\Route;
use Modules\Clinic\Http\Controllers\AuthController;
use Modules\Clinic\Http\Controllers\PasswordResetController;

Route::prefix('clinic/auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:clinic-login');
    Route::post('forgot-password', [PasswordResetController::class, 'forgotPassword'])->middleware('throttle:clinic-password');
    Route::post('reset-password', [PasswordResetController::class, 'resetPassword'])->middleware('throttle:clinic-password');

    Route::middleware('auth:clinic')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });
});
