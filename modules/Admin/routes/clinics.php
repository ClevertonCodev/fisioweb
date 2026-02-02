<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Http\Controllers\ClinicsController;

Route::admin(function () {
    Route::get('clinics', [ClinicsController::class, 'index'])->name('clinics.index');
    Route::get('clinics/create', [ClinicsController::class, 'create'])->name('clinics.create');
    Route::post('clinics', [ClinicsController::class, 'store'])->name('clinics.store');
});
