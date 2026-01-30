<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FeaturePlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FeaturePlansController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'feature_id' => ['required', 'integer', 'exists:features,id'],
            'value' => ['required', Rule::in([true, false, 'true', 'false', 1, 0, '1', '0'])],
        ], [
            'plan_id.exists' => 'O plano selecionado não existe.',
            'feature_id.exists' => 'A funcionalidade selecionada não existe.',
        ]);

        $exists = FeaturePlan::query()
            ->where('plan_id', $validated['plan_id'])
            ->where('feature_id', $validated['feature_id'])
            ->exists();

        if ($exists) {
            return redirect()
                ->route('admin.plans.configure-features')
                ->with('error', 'Esta funcionalidade já está configurada para este plano.');
        }

        FeaturePlan::create([
            'plan_id' => $validated['plan_id'],
            'feature_id' => $validated['feature_id'],
            'value' => filter_var($validated['value'], FILTER_VALIDATE_BOOLEAN),
        ]);

        return redirect()
            ->route('admin.plans.configure-features')
            ->with('success', 'Configuração adicionada com sucesso!');
    }

    public function destroy(FeaturePlan $featurePlan): RedirectResponse
    {
        $featurePlan->delete();

        return redirect()
            ->route('admin.plans.configure-features')
            ->with('success', 'Configuração removida com sucesso!');
    }
}
