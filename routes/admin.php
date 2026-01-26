<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Rotas para a área administrativa do sistema
|
*/

// Rotas públicas de autenticação admin
Route::prefix('admin')->name('admin.')->group(function () {
    // Login
    Route::get('login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->middleware(['throttle:login']);

    // Registro
    Route::get('register', [AuthController::class, 'showRegisterForm'])->name('register');
    Route::post('register', [AuthController::class, 'register']);

    // Recuperação de senha
    Route::get('forgot-password', [AuthController::class, 'showForgotPasswordForm'])->name('password.request');
    Route::post('forgot-password', [AuthController::class, 'sendPasswordResetLink'])->name('password.email');

    // Redefinir senha
    Route::get('reset-password/{token}', [AuthController::class, 'showResetPasswordForm'])->name('password.reset');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->name('password.update');

    // Verificação de e-mail
    Route::get('verify-email', [AuthController::class, 'showVerifyEmailForm'])->name('verification.notice')
        ->middleware('auth:web');
    Route::post('email/verification-notification', [AuthController::class, 'sendVerificationEmail'])
        ->middleware(['auth:web', 'throttle:6,1'])
        ->name('verification.send');

    // Confirmação de senha
    Route::get('confirm-password', [AuthController::class, 'showConfirmPasswordForm'])->name('password.confirm')
        ->middleware('auth:web');
    Route::post('confirm-password', [AuthController::class, 'confirmPassword'])
        ->middleware('auth:web');

    // Autenticação de dois fatores
    Route::get('two-factor-challenge', [AuthController::class, 'showTwoFactorChallengeForm'])
        ->name('two-factor.login');
    Route::post('two-factor-challenge', [AuthController::class, 'twoFactorChallenge'])
        ->middleware(['throttle:two-factor']);
});

// Rotas protegidas admin
Route::prefix('admin')->name('admin.')->middleware(['auth:web', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Settings
    Route::redirect('settings', '/admin/settings/profile');
    Route::get('settings/profile', [App\Http\Controllers\Settings\ProfileController::class, 'edit'])->name('settings.profile.edit');
    Route::patch('settings/profile', [App\Http\Controllers\Settings\ProfileController::class, 'update'])->name('settings.profile.update');
    Route::delete('settings/profile', [App\Http\Controllers\Settings\ProfileController::class, 'destroy'])->name('settings.profile.destroy');

    Route::get('settings/password', [App\Http\Controllers\Settings\PasswordController::class, 'edit'])->name('settings.password.edit');
    Route::put('settings/password', [App\Http\Controllers\Settings\PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('settings.password.update');

    Route::get('settings/appearance', function () {
        return Inertia\Inertia::render('settings/appearance');
    })->name('settings.appearance.edit');

    Route::get('settings/two-factor', [App\Http\Controllers\Settings\TwoFactorAuthenticationController::class, 'show'])
        ->name('settings.two-factor.show');
});

// Logout admin (pode ser acessado sem verified)
Route::prefix('admin')->name('admin.')->middleware(['auth:web'])->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
});
