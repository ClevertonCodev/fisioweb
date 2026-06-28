<?php

use Illuminate\Support\Facades\Route;
use Modules\ClinicScheduling\Http\Controllers\AppointmentController;

Route::prefix('clinic')->middleware(['auth:clinic', 'clinic.guard'])->group(function () {
    Route::prefix('appointments')->name('clinic.appointments.')->group(function () {
        Route::get('/', [AppointmentController::class, 'index'])->name('index');
        Route::post('/', [AppointmentController::class, 'store'])->name('store');
        Route::get('{appointment}', [AppointmentController::class, 'show'])->name('show');
        Route::put('{appointment}', [AppointmentController::class, 'update'])->name('update');
        Route::patch('{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('status');
        Route::post('{appointment}/cancel', [AppointmentController::class, 'cancel'])->name('cancel');
    });
});
