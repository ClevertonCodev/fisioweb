<?php

namespace Modules\Admin\Http\Controllers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Controllers\Controller;
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
use Modules\Admin\Models\User;

class AuthController extends Controller
{
    /**
     * Show the admin login form.
     */
    public function showLoginForm(Request $request): Response
    {
        return Inertia::render('admin/auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister'      => Features::enabled(Features::registration()),
            'status'           => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an admin login request.
     */
    public function login(Request $request): RedirectResponse
    {
        $request->validate([
            Fortify::username() => 'required|string',
            'password'          => 'required|string',
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

            return redirect()->route('admin.two-factor.login');
        }

        Auth::login($user, $request->boolean('remember'));

        return redirect()->intended(route('admin.dashboard'));
    }

    /**
     * Show the admin registration form.
     */
    public function showRegisterForm(): Response
    {
        return Inertia::render('admin/auth/register');
    }

    /**
     * Handle an admin registration request.
     */
    public function register(Request $request, CreateNewUser $creator): RedirectResponse
    {
        $user = $creator->create($request->all());

        Auth::login($user);

        return redirect()->route('admin.dashboard');
    }

    /**
     * Show the admin forgot password form.
     */
    public function showForgotPasswordForm(Request $request): Response
    {
        return Inertia::render('admin/auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Send a password reset link to the admin user.
     */
    public function sendPasswordResetLink(Request $request): RedirectResponse
    {
        $request->validate([Fortify::email() => 'required|email']);

        $status = Password::sendResetLink(
            $request->only(Fortify::email())
        );

        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        throw ValidationException::withMessages([Fortify::email() => [__($status)]]);
    }

    /**
     * Show the admin reset password form.
     */
    public function showResetPasswordForm(Request $request): Response
    {
        return Inertia::render('admin/auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Reset the admin user's password.
     */
    public function resetPassword(Request $request, ResetUserPassword $resetter): RedirectResponse
    {
        $request->validate([
            'token'          => 'required',
            Fortify::email() => 'required|email',
            'password'       => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
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
            return redirect()->route('admin.login')->with('status', __($status));
        }

        throw ValidationException::withMessages([Fortify::email() => [__($status)]]);
    }

    /**
     * Show the admin email verification form.
     */
    public function showVerifyEmailForm(Request $request): Response
    {
        return $request->user()->hasVerifiedEmail()
            ? redirect()->route('admin.dashboard')
            : Inertia::render('admin/auth/verify-email', [
                'status' => $request->session()->get('status'),
            ]);
    }

    /**
     * Send a new email verification notification.
     */
    public function sendVerificationEmail(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->route('admin.dashboard');
        }

        $request->user()->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }

    /**
     * Show the admin password confirmation form.
     */
    public function showConfirmPasswordForm(): Response
    {
        return Inertia::render('admin/auth/confirm-password');
    }

    /**
     * Confirm the admin user's password.
     */
    public function confirmPassword(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        if (!Hash::check($request->password, $request->user()->password)) {
            throw ValidationException::withMessages(['password' => [__('auth.password')]]);
        }

        $request->session()->passwordConfirmed();

        return redirect()->intended();
    }

    /**
     * Show the admin two-factor challenge form.
     */
    public function showTwoFactorChallengeForm(): Response|RedirectResponse
    {
        if (!session()->has('login.id')) {
            return redirect()->route('admin.login');
        }

        return Inertia::render('admin/auth/two-factor-challenge');
    }

    /**
     * Handle the admin two-factor challenge.
     */
    public function twoFactorChallenge(Request $request): RedirectResponse
    {
        $user = User::findOrFail($request->session()->get('login.id'));

        if (!$user->two_factor_secret) {
            return redirect()->route('admin.login');
        }

        $request->validate([
            'code'          => 'required_without:recovery_code|string',
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

        Auth::login($user);

        return redirect()->intended(route('admin.dashboard'));
    }

    /**
     * Handle an admin logout request.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
