<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

require __DIR__.'/admin.php';
require __DIR__.'/clinic.php';

// Route::post('logout', function (Request $request) {
//     if (Auth::guard('clinic')->check()) {
//         Auth::guard('clinic')->logout();
//     } elseif (Auth::guard('web')->check()) {
//         Auth::guard('web')->logout();
//     } else {
//         Auth::logout();
//     }

//     $request->session()->invalidate();
//     $request->session()->regenerateToken();

//     return redirect()->route('home');
// })->middleware('auth')->name('logout');

Route::fallback(function () {
    return redirect()->route('home');
});
