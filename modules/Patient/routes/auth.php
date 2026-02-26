<?php

use Illuminate\Support\Facades\Route;
use Modules\Patient\Http\Controllers\AuthController;

// Rotas públicas (sem auth)
Route::patient(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->name('login.attempt');
}, protected: false);

// Rotas protegidas (requer auth:patient)
Route::patient(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('choose-clinic', [AuthController::class, 'showChooseClinic'])->name('choose-clinic');
    Route::post('choose-clinic', [AuthController::class, 'chooseClinic'])->name('choose-clinic.store');
});
