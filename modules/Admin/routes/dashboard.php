<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Http\Controllers\DashboardController;

Route::admin(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});
