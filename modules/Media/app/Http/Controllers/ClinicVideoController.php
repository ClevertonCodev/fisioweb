<?php

namespace Modules\Media\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Media\Contracts\VideoServiceInterface;
use Modules\Media\Exceptions\VideoStorageFileMissingException;
use Modules\Media\Http\Requests\PresignedThumbnailUploadRequest;
use Modules\Media\Http\Requests\PresignedVideoUploadRequest;

class ClinicVideoController extends ClinicAuthenticatedController
{
    public function __construct(
        protected VideoServiceInterface $videoService,
    ) {}

    public function requestPresignedUploadUrl(PresignedVideoUploadRequest $request): JsonResponse
    {
        try {
            $result = $this->videoService->requestPresignedUpload(
                $request->validated('filename'),
                $request->validated('mime_type'),
                $request->validated('size'),
                config('cloudflare.video_directory', 'videos'),
                null,
                $this->clinicId(),
            );

            return response()->json([
                'data' => $result,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function requestPresignedThumbnailUrl(int $video, PresignedThumbnailUploadRequest $request): JsonResponse
    {
        try {
            $this->ensureOwnedVideo($video);

            $result = $this->videoService->requestPresignedThumbnailUpload(
                $video,
                $request->validated('filename'),
                $request->validated('mime_type'),
                $request->validated('size'),
            );

            return response()->json([
                'data' => $result,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => 'Vídeo não encontrado',
            ], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function requestPresignedThumbnailReplaceUrl(int $video, PresignedThumbnailUploadRequest $request): JsonResponse
    {
        try {
            $this->ensureOwnedVideo($video);

            $result = $this->videoService->requestPresignedThumbnailReplace(
                $video,
                $request->validated('filename'),
                $request->validated('mime_type'),
                $request->validated('size'),
            );

            return response()->json([
                'data' => $result,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => 'Vídeo não encontrado',
            ], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function confirmUpload(Request $request, int $video): JsonResponse
    {
        $validated = $request->validate([
            'thumbnail_path'    => ['nullable', 'string', 'max:512'],
            'original_filename' => ['nullable', 'string', 'max:255'],
            'duration'          => ['nullable', 'integer', 'min:0'],
        ]);

        // Sem `metadata` do cliente: ele guarda a lista de imagens autorizadas do vídeo.
        $duration         = isset($validated['duration']) ? (int) $validated['duration'] : null;
        $originalFilename = $validated['original_filename'] ?? null;

        try {
            $this->ensureOwnedVideo($video);

            $result = $this->videoService->confirmPresignedUpload(
                $video,
                $validated['thumbnail_path'] ?? null,
                $originalFilename,
                $duration,
            );

            return response()->json([
                'message' => 'Upload confirmado com sucesso',
                'data'    => $result,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => 'Vídeo não encontrado',
            ], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (VideoStorageFileMissingException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function syncReferenceImages(Request $request, int $video): JsonResponse
    {
        $validated = $request->validate([
            'reference_image_paths'   => ['present', 'array', 'max:2'],
            'reference_image_paths.*' => ['string', 'max:512'],
        ]);

        try {
            $this->ensureOwnedVideo($video);
            $this->videoService->ensureReferenceImagesBelongToVideo($video, $validated['reference_image_paths'] ?? []);

            $result = $this->videoService->syncReferenceImages(
                $video,
                $validated['reference_image_paths'] ?? [],
                changedByOperator: false,
            );

            return response()->json([
                'message' => 'Imagens de referência atualizadas com sucesso',
                'data'    => $result,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => 'Vídeo não encontrado',
            ], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    private function ensureOwnedVideo(int $videoId): void
    {
        if (!$this->videoService->isOwnedByClinic($videoId, $this->clinicId())) {
            throw new ModelNotFoundException('Vídeo não encontrado.');
        }
    }
}
