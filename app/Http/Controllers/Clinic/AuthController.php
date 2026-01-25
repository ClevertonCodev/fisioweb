<?php

namespace App\Http\Controllers\Clinic;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class AuthController extends Controller
{
    /**
     * Show the clinic login form.
     */
    public function showLoginForm(Request $request): Response
    {
        return Inertia::render('clinic/auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle a clinic login request.
     */
    public function login(Request $request): RedirectResponse
    {
        $request->validate([
            Fortify::username() => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([Fortify::username() => [__('auth.failed')]]);
        }

        // Verificar se o usuário tem autenticação de dois fatores
        if (Features::enabled(Features::twoFactorAuthentication())
            && $user->two_factor_secret
            && $user->two_factor_confirmed_at) {
            $request->session()->put('login.id', $user->id);

            return redirect()->route('clinic.two-factor.login');
        }

        Auth::guard('clinic')->login($user, $request->boolean('remember'));

        return redirect()->intended(route('clinic.dashboard'));
    }

    /**
     * Show the clinic registration form.
     */
    public function showRegisterForm(): Response
    {
        return Inertia::render('clinic/auth/register');
    }

    /**
     * Handle a clinic registration request.
     */
    public function register(Request $request, CreateNewUser $creator): RedirectResponse
    {
        $user = $creator->create($request->all());

        Auth::guard('clinic')->login($user);

        return redirect()->route('clinic.dashboard');
    }

    /**
     * Show the clinic forgot password form.
     */
    public function showForgotPasswordForm(Request $request): Response
    {
        return Inertia::render('clinic/auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Send a password reset link to the clinic user.
     */
    public function sendPasswordResetLink(Request $request): RedirectResponse
    {
        $request->validate([Fortify::email() => 'required|email']);

        $status = Password::broker('clinic_users')->sendResetLink(
            $request->only(Fortify::email())
        );

        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        throw ValidationException::withMessages([Fortify::email() => [__($status)]]);
    }

    /**
     * Show the clinic reset password form.
     */
    public function showResetPasswordForm(Request $request): Response
    {
        return Inertia::render('clinic/auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Reset the clinic user's password.
     */
    public function resetPassword(Request $request, ResetUserPassword $resetter): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            Fortify::email() => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::broker('clinic_users')->reset(
            $request->only(
                Fortify::email(),
                'password',
                'password_confirmation',
                'token'
            ),
            function ($user, $password) use ($resetter) {
                $resetter->reset($user, ['password' => $password]);

                event(new PasswordReset($user));
            }
        );

        if ($status == Password::PASSWORD_RESET) {
            return redirect()->route('clinic.login')->with('status', __($status));
        }

        throw ValidationException::withMessages([Fortify::email() => [__($status)]]);
    }

    /**
     * Show the clinic email verification form.
     */
    public function showVerifyEmailForm(Request $request): Response
    {
        return $request->user('clinic')->hasVerifiedEmail()
            ? redirect()->route('clinic.dashboard')
            : Inertia::render('clinic/auth/verify-email', [
                'status' => $request->session()->get('status'),
            ]);
    }

    /**
     * Send a new email verification notification.
     */
    public function sendVerificationEmail(Request $request): RedirectResponse
    {
        if ($request->user('clinic')->hasVerifiedEmail()) {
            return redirect()->route('clinic.dashboard');
        }

        $request->user('clinic')->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }

    /**
     * Show the clinic password confirmation form.
     */
    public function showConfirmPasswordForm(): Response
    {
        return Inertia::render('clinic/auth/confirm-password');
    }

    /**
     * Confirm the clinic user's password.
     */
    public function confirmPassword(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user('clinic');

        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages(['password' => [__('auth.password')]]);
        }

        $request->session()->passwordConfirmed();

        return redirect()->intended();
    }

    /**
     * Show the clinic two-factor challenge form.
     */
    public function showTwoFactorChallengeForm(): Response|RedirectResponse
    {
        if (!session()->has('login.id')) {
            return redirect()->route('clinic.login');
        }

        return Inertia::render('clinic/auth/two-factor-challenge');
    }

    /**
     * Handle the clinic two-factor challenge.
     */
    public function twoFactorChallenge(Request $request): RedirectResponse
    {
        $user = User::findOrFail($request->session()->get('login.id'));

        if (!$user->two_factor_secret) {
            return redirect()->route('clinic.login');
        }

        $request->validate([
            'code' => 'required_without:recovery_code|string',
            'recovery_code' => 'required_without:code|string',
        ]);

        if ($request->filled('code')) {
            if (!$user->verifyTwoFactorCode($request->code)) {
                throw ValidationException::withMessages(['code' => [__('The provided two factor authentication code was invalid.')]]);
            }
        } elseif ($request->filled('recovery_code')) {
            $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes), true);

            if (!in_array($request->recovery_code, $recoveryCodes)) {
                throw ValidationException::withMessages(['recovery_code' => [__('The provided two factor recovery code was invalid.')]]);
            }

            $recoveryCodes = array_values(array_diff($recoveryCodes, [$request->recovery_code]));
            $user->forceFill([
                'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
            ])->save();
        } else {
            throw ValidationException::withMessages(['code' => [__('The two factor authentication code or recovery code is required.')]]);
        }

        $request->session()->forget('login.id');

        Auth::guard('clinic')->login($user);

        return redirect()->intended(route('clinic.dashboard'));
    }

    /**
     * Handle a clinic logout request.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('clinic')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('clinic.login');
    }
}
