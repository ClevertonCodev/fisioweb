<?php

use Illuminate\Support\Facades\Route;
use Modules\Clinic\Http\Controllers\DashboardController;

Route::clinic(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});
