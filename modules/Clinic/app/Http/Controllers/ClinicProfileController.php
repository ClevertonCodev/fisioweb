<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Modules\Clinic\Contracts\ClinicServiceInterface;
use Modules\Clinic\Http\Requests\UpdateClinicProfileRequest;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

class ClinicProfileController extends ClinicAuthenticatedController
{
    public function __construct(
        protected ClinicServiceInterface $clinicService,
    ) {}

    public function show(): JsonResponse
    {
        $user = $this->clinicUser();

        if (!$user instanceof ClinicUser || !$user->isAdmin()) {
            return response()->json(['message' => 'Acesso não autorizado.'], 403);
        }

        $clinic = $this->clinicService->findById($this->clinicId());
        $clinic->load('plan:id,name');

        return response()->json([
            'data' => $this->toProfilePayload($clinic),
        ]);
    }

    public function update(UpdateClinicProfileRequest $request): JsonResponse
    {
        $clinic = $this->clinicService->update(
            $this->clinicId(),
            $request->validated(),
        );

        $clinic->load('plan:id,name');

        return response()->json([
            'data' => $this->toProfilePayload($clinic),
        ]);
    }

    private function toProfilePayload(Clinic $clinic): array
    {
        return [
            'id'          => $clinic->id,
            'name'        => $clinic->name,
            'email'       => $clinic->email,
            'document'    => $clinic->document,
            'type_person' => $clinic->type_person,
            'status'      => $clinic->status,
            'slug'        => $clinic->slug,
            'phone'       => $clinic->phone,
            'zip_code'    => $clinic->zip_code,
            'address'     => $clinic->address,
            'number'      => $clinic->number,
            'city'        => $clinic->city,
            'state'       => $clinic->state,
            'plan_id'     => $clinic->plan_id,
            'plan'        => $clinic->plan ? [
                'id'   => $clinic->plan->id,
                'name' => $clinic->plan->name,
            ] : null,
        ];
    }
}
