<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Http\Controllers\ClinicsController;

Route::admin(function () {
    Route::get('clinics', [ClinicsController::class, 'index'])->name('clinics.index');
    Route::get('clinics/create', [ClinicsController::class, 'create'])->name('clinics.create');
    Route::post('clinics', [ClinicsController::class, 'store'])->name('clinics.store');
    Route::get('clinics/{clinic}', [ClinicsController::class, 'show'])->name('clinics.show');
    Route::get('clinics/{clinic}/edit', [ClinicsController::class, 'edit'])->name('clinics.edit');
    Route::put('clinics/{clinic}', [ClinicsController::class, 'update'])->name('clinics.update');
    Route::put('clinics/{clinic}/reactivate', [ClinicsController::class, 'reactivate'])->name('clinics.reactivate');
    Route::delete('clinics/{clinic}', [ClinicsController::class, 'destroy'])->name('clinics.destroy');
});
