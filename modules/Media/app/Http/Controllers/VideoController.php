<?php

namespace Modules\Media\Http\Controllers;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Media\Contracts\VideoServiceInterface;
use Modules\Media\Http\Requests\PresignedThumbnailUploadRequest;
use Modules\Media\Http\Requests\PresignedVideoUploadRequest;

class VideoController extends Controller
{
    public function __construct(
        protected VideoServiceInterface $videoService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 15);

        return response()->json([
            'data' => $this->videoService->getAllVideos($perPage),
        ]);
    }

    public function show($id): JsonResponse
    {
        $video = $this->videoService->getVideo($id);

        if (!$video) {
            return response()->json([
                'message' => 'Vídeo não encontrado',
            ], 404);
        }

        return response()->json([
            'data' => $video,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        try {
            $this->videoService->deleteVideo($id);

            return response()->json([
                'message' => 'Video deletado com sucesso',
            ]);
        } catch (ModelNotFoundException) {
            return response()->json([
                'message' => 'Vídeo não encontrado',
            ], 404);
        }
    }

    public function requestPresignedUploadUrl(PresignedVideoUploadRequest $request): JsonResponse
    {
        try {
            $result = $this->videoService->requestPresignedUpload(
                $request->validated('filename'),
                $request->validated('mime_type'),
                $request->validated('size'),
                config('cloudflare.video_directory', 'videos'),
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

    public function confirmUpload(Request $request, int $video): JsonResponse
    {
        $validated = $request->validate([
            'thumbnail_path'    => ['nullable', 'string', 'max:512'],
            'original_filename' => ['nullable', 'string', 'max:255'],
            'duration'          => ['nullable', 'integer', 'min:0'],
            'metadata'          => ['nullable', 'array'],
        ]);

        $metadata         = isset($validated['metadata']) ? $validated['metadata'] : null;
        $duration         = isset($validated['duration']) ? (int) $validated['duration'] : null;
        $originalFilename = $validated['original_filename'] ?? null;

        try {
            $result = $this->videoService->confirmPresignedUpload(
                $video,
                $validated['thumbnail_path'] ?? null,
                $originalFilename,
                $duration,
                $metadata,
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
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function requestPresignedThumbnailReplaceUrl(int $video, PresignedThumbnailUploadRequest $request): JsonResponse
    {
        try {
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

    public function update(Request $request, int $video): JsonResponse
    {
        $validated = $request->validate([
            'original_filename' => ['nullable', 'string', 'max:255'],
            'duration'          => ['nullable', 'integer', 'min:0'],
            'metadata'          => ['nullable', 'array'],
            'thumbnail_path'    => ['nullable', 'string', 'max:512'],
        ]);

        try {
            $result = $this->videoService->updateVideo($video, $validated);

            return response()->json([
                'message' => 'Vídeo atualizado com sucesso',
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
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function updateMetadata($id, Request $request): JsonResponse
    {
        $request->validate([
            'metadata' => 'required|array',
        ]);

        try {
            $video = $this->videoService->updateMetadata($id, $request->input('metadata'));

            return response()->json([
                'message' => 'Metadados do vídeo atualizados com sucesso',
                'data'    => $video,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Vídeo não encontrado',
            ], 404);
        }
    }
}
