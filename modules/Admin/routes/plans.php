<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Http\Controllers\ConfigureFeaturesController;
use Modules\Admin\Http\Controllers\FeaturePlansController;
use Modules\Admin\Http\Controllers\PlansController;

Route::admin(function () {
    Route::get('plans', [PlansController::class, 'index'])->name('plans.index');
    Route::get('plans/create', [PlansController::class, 'create'])->name('plans.create');
    Route::post('plans', [PlansController::class, 'store'])->name('plans.store');
    Route::get('plans/{plan}/edit', [PlansController::class, 'edit'])->name('plans.edit');
    Route::put('plans/{plan}', [PlansController::class, 'update'])->name('plans.update');
    Route::get('plans/configure-features', [ConfigureFeaturesController::class, 'index'])->name('plans.configure-features');
    Route::post('feature-plans', [FeaturePlansController::class, 'store'])->name('feature-plans.store');
    Route::delete('feature-plans/{featurePlan}', [FeaturePlansController::class, 'destroy'])->name('feature-plans.destroy');
});
