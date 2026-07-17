<?php

use Illuminate\Support\Facades\Route;

// SPA catch-all: exclui API e o Log Viewer (opcodesio/log-viewer)
Route::get('/{any?}', fn () => view('app'))->where('any', '^(?!api(?:/|$)|log-viewer(?:/|$)).*$');
