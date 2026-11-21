<?php

use Illuminate\Support\Facades\Route;
use Modules\Email\Http\Controllers\ReminderUnsubscribeController;

Route::post('email/reminders/unsubscribe', [ReminderUnsubscribeController::class, 'store'])
    ->middleware('throttle:reminder-unsubscribe')
    ->name('email.reminders.unsubscribe');
