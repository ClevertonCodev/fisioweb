<?php

use Illuminate\Support\Facades\Route;
use Modules\Clinic\Http\Controllers\Admin\ClinicController;

Route::prefix('admin/clinics')->middleware('auth:admin')->group(function () {
    Route::get('/', [ClinicController::class, 'index'])->name('admin.clinics.index');
    Route::get('/{id}', [ClinicController::class, 'show'])->name('admin.clinics.show');
    Route::post('/', [ClinicController::class, 'store'])->name('admin.clinics.store');
    Route::put('/{id}/reactivate', [ClinicController::class, 'reactivate'])->name('admin.clinics.reactivate');
    Route::post('/{id}/login-as', [ClinicController::class, 'loginAs'])->name('admin.clinics.login-as');
    Route::put('/{id}', [ClinicController::class, 'update'])->name('admin.clinics.update');
    Route::delete('/{id}', [ClinicController::class, 'destroy'])->name('admin.clinics.destroy');
});
