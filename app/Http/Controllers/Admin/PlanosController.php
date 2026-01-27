<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlanosController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Plan::query();

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('id', $search);
                } else {
                    $q->orWhere('name', 'like', "%{$search}%");
                }
            });
        }

        $plans = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/planos/planos', [
            'plans' => $plans,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/planos/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:plans,name'],
            'type_charge' => ['required', 'string', Rule::in(['por_usuario', 'fixo'])],
            'value_month' => ['required', 'numeric', 'min:0'],
            'value_year' => ['required', 'numeric', 'min:0'],
        ]);

        Plan::create($validated);

        return redirect()
            ->route('admin.planos.planos')
            ->with('success', 'Plano criado com sucesso!');
    }

    public function edit(Plan $plan): Response
    {
        return Inertia::render('admin/planos/edit', [
            'plan' => $plan,
        ]);
    }

    public function update(Request $request, Plan $plan): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('plans')->ignore($plan->id)],
            'type_charge' => ['required', 'string', Rule::in(['por_usuario', 'fixo'])],
            'value_month' => ['required', 'numeric', 'min:0'],
            'value_year' => ['required', 'numeric', 'min:0'],
        ]);

        $plan->update($validated);

        return redirect()
            ->route('admin.planos.planos')
            ->with('success', 'Plano atualizado com sucesso!');
    }
}
