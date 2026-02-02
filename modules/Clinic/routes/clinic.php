<?php

use Illuminate\Support\Facades\Route;
use Modules\Clinic\Http\Controllers\AuthController;

Route::clinic(function () {
    // Route::get('login', [AuthController::class, 'showLoginForm'])->name('login');
    // Route::post('login', [AuthController::class, 'login'])->middleware(['throttle:login']);
});
