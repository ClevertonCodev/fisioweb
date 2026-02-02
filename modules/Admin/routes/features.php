<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Http\Controllers\FeaturesController;

Route::admin(function () {
    Route::redirect('plans/features', '/admin/functionalities')->name('plans.features');
    Route::get('functionalities', [FeaturesController::class, 'index'])->name('functionalities.index');
    Route::get('functionalities/create', [FeaturesController::class, 'create'])->name('functionalities.create');
    Route::post('functionalities', [FeaturesController::class, 'store'])->name('functionalities.store');
    Route::get('functionalities/{feature}/edit', [FeaturesController::class, 'edit'])->name('functionalities.edit');
    Route::put('functionalities/{feature}', [FeaturesController::class, 'update'])->name('functionalities.update');
});
