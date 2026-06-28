<?php

use Illuminate\Support\Facades\Route;
use Modules\ClinicFinance\Http\Controllers\FinancialCategoryController;
use Modules\ClinicFinance\Http\Controllers\FinancialExportController;
use Modules\ClinicFinance\Http\Controllers\FinancialReportController;
use Modules\ClinicFinance\Http\Controllers\FinancialSummaryController;
use Modules\ClinicFinance\Http\Controllers\FinancialTransactionController;

Route::prefix('clinic')->middleware(['auth:clinic', 'clinic.guard'])->group(function () {
    Route::prefix('finances')->middleware('clinic.admin')->name('clinic.finances.')->group(function () {
        Route::get('transactions/trash', [FinancialTransactionController::class, 'trash'])->name('transactions.trash');
        Route::post('transactions/{id}/restore', [FinancialTransactionController::class, 'restore'])->name('transactions.restore');
        Route::apiResource('transactions', FinancialTransactionController::class);

        Route::get('summary', [FinancialSummaryController::class, 'summary'])->name('summary');
        Route::put('opening-balance', [FinancialSummaryController::class, 'updateOpeningBalance'])->name('opening-balance');

        Route::get('categories', [FinancialCategoryController::class, 'index'])->name('categories.index');
        Route::post('categories', [FinancialCategoryController::class, 'store'])->name('categories.store');
        Route::post('categories/{category}/toggle-active', [FinancialCategoryController::class, 'toggleActive'])->name('categories.toggle-active');
        Route::delete('categories/{category}', [FinancialCategoryController::class, 'destroy'])->name('categories.destroy');

        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('summary', [FinancialReportController::class, 'summary'])->name('summary');
            Route::get('income-vs-expense', [FinancialReportController::class, 'incomeVsExpense'])->name('income-vs-expense');
            Route::get('category-distribution', [FinancialReportController::class, 'categoryDistribution'])->name('category-distribution');
            Route::get('monthly-comparison', [FinancialReportController::class, 'monthlyComparison'])->name('monthly-comparison');
            Route::get('category-breakdown', [FinancialReportController::class, 'categoryBreakdown'])->name('category-breakdown');
        });

        Route::get('export', [FinancialExportController::class, 'export'])->name('export');
    });
});
