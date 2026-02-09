<?php

namespace Modules\Media\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Media\Contracts\VideoServiceInterface;
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
