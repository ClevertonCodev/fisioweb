<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (auth()->guard('clinic')->check()) {
        return redirect()->route('clinic.dashboard');
    }

    if (auth()->guard('web')->check()) {
        return redirect()->route('admin.dashboard');
    }

    return redirect()->route('clinic.login');
})->name('home');

Route::fallback(function () {
    return redirect()->route('home');
});
