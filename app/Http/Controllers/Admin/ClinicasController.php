<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClinicasController extends Controller
{
    /**
     * Display the clinics page.
     */
    public function index(Request $request): Response
    {
        $query = Clinic::with('plan');

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('id', $search);
                } else {
                    $q->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('document', 'like', "%{$search}%");
                }
            });
        }

        if ($request->filled('plan_id')) {
            $query->where('plan_id', $request->get('plan_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->get('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->get('date_to'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $clinics = $query->orderBy('created_at', 'desc')
            ->paginate(3)
            ->withQueryString();

        $plans = Plan::orderBy('name')->get();

        return Inertia::render('admin/clinicas', [
            'clinics' => $clinics,
            'plans' => $plans,
            'filters' => $request->only(['search', 'plan_id', 'date_from', 'date_to', 'status']),
        ]);
    }
}
