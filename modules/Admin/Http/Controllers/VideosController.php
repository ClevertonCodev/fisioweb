<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class VideosController extends Controller
{
    public function upload(): Response
    {
        return Inertia::render('admin/videos/upload');
    }
}
