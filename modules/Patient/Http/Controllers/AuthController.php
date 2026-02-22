<?php

namespace Modules\Patient\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Patient\Http\Requests\PatientLoginRequest;
use Modules\Patient\Models\Patient;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('Patient/Auth/Login');
    }

    public function login(PatientLoginRequest $request): RedirectResponse
    {
        $identifier = $request->input('identifier');
        // Senha padrão é o CPF só com números — normaliza o que o paciente digitou
        $password   = preg_replace('/\D/', '', $request->input('password')) ?: $request->input('password');

        // Busca por e-mail ou CPF (aceita CPF com ou sem formatação)
        $cpfNormalized = preg_replace('/\D/', '', $identifier);
        $patient       = Patient::where('email', $identifier)
            ->orWhere('cpf', $identifier)
            ->orWhere('cpf', $cpfNormalized)
            ->first();

        if (!$patient || !Hash::check($password, $patient->password)) {
            return back()->withErrors([
                'identifier' => 'Credenciais inválidas. Verifique seu e-mail/CPF e senha.',
            ])->onlyInput('identifier');
        }

        if (!$patient->is_active) {
            return back()->withErrors([
                'identifier' => 'Sua conta está inativa. Entre em contato com a clínica.',
            ])->onlyInput('identifier');
        }

        Auth::guard('patient')->login($patient, $request->boolean('remember'));

        $request->session()->regenerate();

        return $this->redirectAfterLogin($patient);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('patient')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('patient.login');
    }

    public function showChooseClinic(): Response
    {
        /** @var Patient $patient */
        $patient = Auth::guard('patient')->user();
        $clinics = $patient->clinics()->orderBy('name')->get(['clinics.id', 'clinics.name', 'clinics.slug']);

        return Inertia::render('Patient/Auth/ChooseClinic', [
            'clinics' => $clinics,
        ]);
    }

    public function chooseClinic(Request $request): RedirectResponse
    {
        $request->validate([
            'slug' => ['required', 'string', 'exists:clinics,slug'],
        ], [
            'slug.required' => 'Selecione uma clínica.',
            'slug.exists'   => 'Clínica inválida.',
        ]);

        /** @var Patient $patient */
        $patient = Auth::guard('patient')->user();

        // Verifica que o paciente realmente pertence a essa clínica
        $clinic = $patient->clinics()->where('slug', $request->input('slug'))->first();

        if (!$clinic) {
            return back()->withErrors(['slug' => 'Você não está vinculado a esta clínica.']);
        }

        return redirect()->route('patient.dashboard', ['clinic' => $clinic->slug]);
    }

    private function redirectAfterLogin(Patient $patient): RedirectResponse
    {
        $clinics = $patient->clinics()->get(['clinics.id', 'clinics.slug']);

        if ($clinics->count() === 1) {
            return redirect()->route('patient.dashboard', ['clinic' => $clinics->first()->slug]);
        }

        return redirect()->route('patient.choose-clinic');
    }
}
