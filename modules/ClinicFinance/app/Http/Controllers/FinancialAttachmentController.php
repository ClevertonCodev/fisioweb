<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Modules\ClinicFinance\Contracts\FinancialAttachmentServiceInterface;
use Modules\ClinicFinance\Http\Requests\StoreFinancialAttachmentsRequest;
use Modules\ClinicFinance\Models\FinancialAttachment;

/**
 * Comprovantes do lançamento. O papel (administrador ou secretária) passa pela
 * FinancialAttachmentPolicy; a posse do lançamento e do comprovante fica no Service (404).
 */
class FinancialAttachmentController extends ClinicAuthenticatedController
{
    public function __construct(
        protected FinancialAttachmentServiceInterface $attachments,
    ) {}

    public function index(int $id): JsonResponse
    {
        $this->authorize('viewAny', FinancialAttachment::class);

        return response()->json(['data' => $this->attachments->list($this->clinicId(), $id)]);
    }

    public function store(StoreFinancialAttachmentsRequest $request, int $id): JsonResponse
    {
        $this->authorize('create', FinancialAttachment::class);

        $created = $this->attachments->upload($this->clinicId(), $id, $this->clinicUserId(), $request->uploadedFiles());

        return response()->json(['data' => $created], 201);
    }

    public function url(int $id, int $attachmentId): JsonResponse
    {
        $this->authorize('viewAny', FinancialAttachment::class);

        return response()->json(['data' => $this->attachments->signedUrl($this->clinicId(), $id, $attachmentId)]);
    }

    public function destroy(int $id, int $attachmentId): JsonResponse
    {
        $this->authorize('delete', FinancialAttachment::class);

        $this->attachments->delete($this->clinicId(), $id, $attachmentId);

        return response()->json(null, 204);
    }
}
