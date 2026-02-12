<?php

namespace Modules\Media\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Media\Contracts\VideoServiceInterface;
use Modules\Media\Http\Requests\PresignedVideoUploadRequest;
use Modules\Media\Http\Requests\VideoUploadRequest;

class VideoController extends Controller
{
    public function __construct(
        protected VideoServiceInterface $videoService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 15);

        return response()->json([
            'data' => $this->videoService->getAllVideos($perPage),
        ]);
    }

    /**
     * Indica se o cliente deve usar upload via presigned URL (direto para R2).
     * Em produção retorna use_presigned: true.
     */
    public function uploadMode(): JsonResponse
    {
        return response()->json([
            'use_presigned' => config('cloudflare.use_presigned_video_upload', false),
        ]);
    }

    /**
     * Gera URL pré-assinada para o cliente enviar o vídeo direto ao R2.
     */
    public function requestPresignedUploadUrl(PresignedVideoUploadRequest $request): JsonResponse
    {
        try {
            $data = $this->videoService->requestPresignedUpload(
                $request->input('filename'),
                $request->input('mime_type'),
                (int) $request->input('size'),
                config('cloudflare.video_directory', 'videos'),
            );

            return response()->json([
                'message' => 'Use a URL para enviar o vídeo com PUT. Depois chame confirm-upload.',
                'data' => $data,
            ], 200);
        } catch (\Throwable $e) {
            logError('Falha ao gerar presigned URL', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Falha ao gerar URL de upload.',
            ], 500);
        }
    }

    /**
     * Confirma que o upload direto (presigned) foi concluído.
     */
    public function confirmUpload($id, Request $request): JsonResponse
    {
        $request->validate([
            'size' => ['sometimes', 'integer', 'min:0'],
            'mime_type' => ['sometimes', 'string', 'max:100'],
        ]);

        try {
            $video = $this->videoService->confirmPresignedUpload(
                (int) $id,
                $request->has('size') ? (int) $request->input('size') : null,
                $request->input('mime_type'),
            );

            return response()->json([
                'message' => 'Upload confirmado com sucesso',
                'data' => $video,
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Vídeo não encontrado'], 404);
        }
    }

    public function upload(VideoUploadRequest $request): JsonResponse
    {
        try {
            $video = $this->videoService->dispatchUpload(
                $request->file('video'),
                config('cloudflare.video_directory', 'videos'),
            );

            return response()->json([
                'message' => 'Vídeo enviado para processamento',
                'data' => $video,
            ], 202);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function uploadMultiple(VideoUploadRequest $request): JsonResponse
    {
        try {
            $videos = $this->videoService->dispatchMultipleUploads(
                $request->file('videos'),
                config('cloudflare.video_directory', 'videos'),
            );

            return response()->json([
                'message' => 'Vídeos enviados para processamento',
                'data' => $videos,
            ], 202);
        } catch (\Throwable $e) {
            logError('Falha ao enviar vídeos para processamento', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Falha ao enviar vídeos para processamento',
            ], 500);
        }
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

    public function updateMetadata($id, Request $request): JsonResponse
    {
        $request->validate([
            'metadata' => 'required|array',
        ]);

        try {
            $video = $this->videoService->updateMetadata($id, $request->input('metadata'));

            return response()->json([
                'message' => 'Metadados do vídeo atualizados com sucesso',
                'data' => $video,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Vídeo não encontrado',
            ], 404);
        }
    }
}
