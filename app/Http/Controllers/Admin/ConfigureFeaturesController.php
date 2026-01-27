<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ConfigureFeaturesController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/plans/configure-features');
    }
}
