<?php

use Illuminate\Support\Facades\Route;
use Modules\Clinic\Http\Controllers\ClinicController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('clinics', ClinicController::class)->names('clinic');
});
