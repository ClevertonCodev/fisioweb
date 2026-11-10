<?php

use Illuminate\Support\Facades\Route;
use Modules\GoogleCalendar\Http\Controllers\GoogleCalendarController;

Route::prefix('clinic/google-calendar')->name('clinic.google-calendar.')->group(function () {
    Route::get('callback', [GoogleCalendarController::class, 'callback'])->name('callback');

    Route::middleware(['auth:clinic', 'clinic.guard'])->group(function () {
        Route::get('connect', [GoogleCalendarController::class, 'connect'])->name('connect');
        Route::post('complete', [GoogleCalendarController::class, 'complete'])->name('complete');
        Route::get('status', [GoogleCalendarController::class, 'status'])->name('status');
        Route::post('pull', [GoogleCalendarController::class, 'pull'])->name('pull');
        Route::delete('/', [GoogleCalendarController::class, 'disconnect'])->name('disconnect');
    });
});
