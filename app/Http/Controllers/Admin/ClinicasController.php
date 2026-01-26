<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\ValidationHelper;
use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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

    /**
     * Show the form for creating a new clinic.
     */
    public function create(): Response
    {
        $plans = Plan::orderBy('name')->get();

        return Inertia::render('admin/clinicas/create', [
            'plans' => $plans,
        ]);
    }

    /**
     * Store a newly created clinic in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'document' => [
                'required',
                'string',
                'max:255',
                'unique:clinics,document',
                function ($attribute, $value, $fail) use ($request) {
                    $typePerson = $request->input('type_person');
                    if ($typePerson === 'fisica') {
                        if (!ValidationHelper::validateCpf($value)) {
                            $fail('O CPF informado é inválido.');
                        }
                    } elseif ($typePerson === 'juridica') {
                        if (!ValidationHelper::validateCnpj($value)) {
                            $fail('O CNPJ informado é inválido.');
                        }
                    }
                },
            ],
            'type_person' => ['required', 'string', Rule::in(['fisica', 'juridica'])],
            'status' => ['required', Rule::in(['1', '0', '-1', 1, 0, -1])],
            'email' => ['required', 'email', 'max:255', 'unique:clinics,email'],
            'phone' => ['required', 'string', 'max:20'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:clinics,slug'],
            'zip_code' => ['required', 'string', 'max:10'],
            'address' => ['required', 'string', 'max:255'],
            'number' => ['required', 'string', 'max:20'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'max:2'],
            'plan_id' => ['nullable', 'string'],
        ], [
            'plan_id' => [
                function ($attribute, $value, $fail) {
                    if (!empty($value) && !is_numeric($value)) {
                        $fail('O plano selecionado é inválido.');
                    }
                },
            ],
        ]);

        // Gerar slug automaticamente se não foi fornecido, ou garantir que seja único
        if (empty($validated['slug'])) {
            $baseSlug = ValidationHelper::generateSlug($validated['name']);
        } else {
            $baseSlug = $validated['slug'];
        }

        // Garantir que o slug seja único
        $slug = $baseSlug;
        $counter = 1;
        while (Clinic::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        $validated['slug'] = $slug;

        // Converter status para integer
        $validated['status'] = (int) $validated['status'];

        // Converter plan_id vazio para null, ou para integer se tiver valor
        if (empty($validated['plan_id']) || $validated['plan_id'] === '') {
            $validated['plan_id'] = null;
        } else {
            $planId = (int) $validated['plan_id'];
            // Verificar se o plano existe
            if (!Plan::where('id', $planId)->exists()) {
                return redirect()
                    ->back()
                    ->withErrors(['plan_id' => 'O plano selecionado não existe.'])
                    ->withInput();
            }
            $validated['plan_id'] = $planId;
        }

        Clinic::create($validated);

        return redirect()
            ->route('admin.clinicas')
            ->with('success', 'Clínica criada com sucesso!');
    }
}
