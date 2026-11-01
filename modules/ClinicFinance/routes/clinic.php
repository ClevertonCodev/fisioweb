<?php

use Illuminate\Support\Facades\Route;
use Modules\ClinicFinance\Http\Controllers\FinancialAttachmentController;
use Modules\ClinicFinance\Http\Controllers\FinancialCalendarController;
use Modules\ClinicFinance\Http\Controllers\FinancialCategoryController;
use Modules\ClinicFinance\Http\Controllers\FinancialExportController;
use Modules\ClinicFinance\Http\Controllers\FinancialPatientController;
use Modules\ClinicFinance\Http\Controllers\FinancialReportController;
use Modules\ClinicFinance\Http\Controllers\FinancialSummaryController;
use Modules\ClinicFinance\Http\Controllers\FinancialTransactionController;
use Modules\ClinicFinance\Http\Controllers\FinancialTransactionStatusController;
use Modules\ClinicFinance\Http\Middleware\EnsureFinanceAccess;

Route::prefix('clinic')->middleware(['auth:clinic', 'clinic.guard'])->group(function () {
    // Administrador ou secretária; o que é só do administrador leva também o `clinic.admin`.
    Route::prefix('finances')->middleware(EnsureFinanceAccess::class)->name('clinic.finances.')->group(function () {
        Route::get('transactions/trash', [FinancialTransactionController::class, 'trash'])->name('transactions.trash');
        Route::post('transactions/{id}/restore', [FinancialTransactionController::class, 'restore'])->name('transactions.restore');
        Route::patch('transactions/{transaction}/status', FinancialTransactionStatusController::class)->name('transactions.status');
        Route::apiResource('transactions', FinancialTransactionController::class);

        // Comprovantes (014): a posse do lançamento e do comprovante fica no Service (404).
        Route::prefix('transactions/{id}/attachments')->whereNumber(['id', 'attachmentId'])->name('transactions.attachments.')->group(function () {
            Route::get('/', [FinancialAttachmentController::class, 'index'])->name('index');
            Route::post('/', [FinancialAttachmentController::class, 'store'])->name('store');
            Route::get('{attachmentId}/url', [FinancialAttachmentController::class, 'url'])->name('url');
            Route::delete('{attachmentId}', [FinancialAttachmentController::class, 'destroy'])->name('destroy');
        });

        // Seletores de paciente e atendimento do lançamento de entrada (tarefa 013).
        Route::get('patients', [FinancialPatientController::class, 'index'])->name('patients.index');
        Route::get('patients/{patientId}/appointments', [FinancialPatientController::class, 'appointments'])
            ->whereNumber('patientId')->name('patients.appointments');

        Route::get('summary', [FinancialSummaryController::class, 'summary'])->name('summary');
        Route::get('calendar', [FinancialCalendarController::class, 'month'])->name('calendar');
        Route::put('opening-balance', [FinancialSummaryController::class, 'updateOpeningBalance'])->middleware('clinic.admin')->name('opening-balance');
        Route::delete('opening-balance', [FinancialSummaryController::class, 'clearOpeningBalance'])->middleware('clinic.admin')->name('opening-balance.clear');

        Route::get('categories', [FinancialCategoryController::class, 'index'])->name('categories.index');
        Route::middleware('clinic.admin')->group(function () {
            Route::post('categories', [FinancialCategoryController::class, 'store'])->name('categories.store');
            Route::post('categories/{category}/toggle-active', [FinancialCategoryController::class, 'toggleActive'])->name('categories.toggle-active');
            Route::delete('categories/{category}', [FinancialCategoryController::class, 'destroy'])->name('categories.destroy');
        });

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
