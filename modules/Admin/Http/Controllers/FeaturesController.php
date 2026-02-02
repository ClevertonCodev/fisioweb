<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Admin\Models\Feature;

class FeaturesController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Feature::query();

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('id', $search);
                } else {
                    $q->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('key', 'like', "%{$search}%");
                }
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        $functionalities = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/functionalities/index', [
            'functionalities' => $functionalities,
            'filters' => $request->only(['search', 'type']),
            'types' => Feature::availableTypes(),
        ]);
    }

    public function create(): Response
    {
        $allowedKeys = Feature::allowedKeys();
        $registeredKeys = Feature::query()->pluck('key')->all();
        $availableKeys = array_diff_key($allowedKeys, array_flip($registeredKeys));

        return Inertia::render('admin/functionalities/create', [
            'allowedKeys' => $allowedKeys,
            'availableKeys' => $availableKeys,
            'types' => Feature::availableTypes(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'key' => [
                'required',
                'string',
                'max:255',
                'unique:features,key',
                Rule::in(array_keys(Feature::allowedKeys())),
            ],
            'name' => ['required', 'string', 'max:255'],
            'value_isolated' => ['nullable', 'numeric', 'min:0'],
            'type' => ['required', 'string', Rule::in(array_keys(Feature::availableTypes()))],
        ], [
            'key.in' => 'A chave informada não é permitida. Escolha uma das funcionalidades disponíveis.',
        ]);

        Feature::create($validated);

        return redirect()
            ->route('admin.functionalities.index')
            ->with('success', 'Funcionalidade criada com sucesso!');
    }

    public function edit(Feature $feature): Response
    {
        return Inertia::render('admin/functionalities/edit', [
            'functionality' => $feature,
            'allowedKeys' => Feature::allowedKeys(),
        ]);
    }

    public function update(Request $request, Feature $feature): RedirectResponse
    {
        $validated = $request->validate([
            'key' => [
                'required',
                'string',
                'max:255',
                Rule::unique('features')->ignore($feature->id),
                Rule::in(array_keys(Feature::allowedKeys())),
            ],
            'name' => ['required', 'string', 'max:255'],
            'value_isolated' => ['nullable', 'numeric', 'min:0'],
            'type' => ['required', 'string', Rule::in(array_keys(Feature::availableTypes()))],
        ], [
            'key.in' => 'A chave informada não é permitida.',
        ]);

        $feature->update($validated);

        return redirect()
            ->route('admin.functionalities.index')
            ->with('success', 'Funcionalidade atualizada com sucesso!');
    }
}
