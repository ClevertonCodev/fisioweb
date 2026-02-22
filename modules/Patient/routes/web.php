<?php

use Illuminate\Support\Facades\Route;
use Modules\Patient\Http\Controllers\DashboardController;

require __DIR__ . '/auth.php';

// Área do paciente com slug da clínica: /patient/{clinic}/...
Route::patient(function () {
    Route::get('{clinic}/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});
