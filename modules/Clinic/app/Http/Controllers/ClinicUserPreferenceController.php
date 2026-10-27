<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Modules\Clinic\Contracts\ClinicUserPreferenceServiceInterface;
use Modules\Clinic\Http\Requests\ShowClinicUserPreferencesRequest;
use Modules\Clinic\Http\Requests\UpdateClinicUserPreferenceRequest;

/**
 * Preferências do próprio usuário (`/clinic/me/preferences`). Sem Policy: não
 * existe rota que receba outro usuário, o dono é sempre quem está autenticado.
 */
class ClinicUserPreferenceController extends ClinicAuthenticatedController
{
    public function __construct(
        private readonly ClinicUserPreferenceServiceInterface $preferences,
    ) {}

    public function index(ShowClinicUserPreferencesRequest $request): JsonResponse
    {
        $values = $this->preferences->get($this->clinicUser(), $request->preferenceKeys());

        return response()->json(['data' => (object) $values]);
    }

    public function update(UpdateClinicUserPreferenceRequest $request): JsonResponse
    {
        $key   = $request->preferenceKey();
        $value = $this->preferences->set($this->clinicUser(), $key, $request->validated('value'));

        return response()->json([
            'data' => [
                'key'   => $key->value,
                'value' => $value,
            ],
        ]);
    }
}
