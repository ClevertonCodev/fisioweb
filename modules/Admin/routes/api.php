<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Http\Controllers\AuthController;
use Modules\Admin\Http\Controllers\PasswordResetController;

Route::prefix('admin/auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:admin-login');
    Route::post('forgot-password', [PasswordResetController::class, 'forgotPassword'])->middleware('throttle:admin-password');
    Route::post('reset-password', [PasswordResetController::class, 'resetPassword'])->middleware('throttle:admin-password');

    Route::middleware('auth:admin')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });
});
