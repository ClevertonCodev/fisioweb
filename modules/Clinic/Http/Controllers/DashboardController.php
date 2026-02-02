<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the clinic dashboard.
     */
    public function index(): Response
    {
        return Inertia::render('clinic/dashboard');
    }
}
