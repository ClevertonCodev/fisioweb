<?php

namespace Modules\ClinicScheduling\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Modules\ClinicScheduling\Contracts\ServiceTypeServiceInterface;
use Modules\ClinicScheduling\Http\Requests\ReplaceServiceTypesRequest;
use Modules\ClinicScheduling\Models\ServiceType;

class ServiceTypeController extends ClinicAuthenticatedController
{
    public function __construct(
        private readonly ServiceTypeServiceInterface $serviceTypes,
    ) {}

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', ServiceType::class);

        return $this->respond($this->serviceTypes->listForClinic($this->clinicId()));
    }

    public function replace(ReplaceServiceTypesRequest $request): JsonResponse
    {
        $this->authorize('manage', ServiceType::class);

        return $this->respond($this->serviceTypes->replace($this->clinicId(), $request->items()));
    }

    /**
     * @param  Collection<int, ServiceType>  $types
     */
    private function respond(Collection $types): JsonResponse
    {
        return response()->json([
            'data' => $types->map(fn (ServiceType $type) => [
                'id'               => $type->id,
                'name'             => $type->name,
                'duration_minutes' => $type->duration_minutes,
                'position'         => $type->position,
            ])->values(),
        ]);
    }
}
