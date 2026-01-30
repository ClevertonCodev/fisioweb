<?php

namespace App\Http\Controllers\Clinic;

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

    /**
     * Display the exercises library.
     */
    public function exercicios(): Response
    {
        return Inertia::render('clinic/exercicios');
    }
}
