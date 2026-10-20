<?php

use Illuminate\Support\Facades\Route;
use Modules\ClinicScheduling\Http\Controllers\AppointmentController;
use Modules\ClinicScheduling\Http\Controllers\ServiceTypeController;

Route::prefix('clinic')->middleware(['auth:clinic', 'clinic.guard'])->group(function () {
    Route::prefix('appointments')->name('clinic.appointments.')->group(function () {
        Route::get('/', [AppointmentController::class, 'index'])->name('index');
        Route::post('/', [AppointmentController::class, 'store'])->name('store');
        Route::get('{appointment}', [AppointmentController::class, 'show'])->name('show');
        Route::put('{appointment}', [AppointmentController::class, 'update'])->name('update');
        Route::patch('{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('status');
        Route::post('{appointment}/cancel', [AppointmentController::class, 'cancel'])->name('cancel');
    });

    Route::get('patients/{patient}/appointments', [AppointmentController::class, 'patientHistory'])
        ->whereNumber('patient')
        ->name('clinic.patients.appointments');

    Route::get('service-types', [ServiceTypeController::class, 'index'])->name('clinic.service-types.index');
    Route::put('service-types', [ServiceTypeController::class, 'replace'])->name('clinic.service-types.replace');
});
