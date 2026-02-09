<?php

namespace Modules\Media\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Media\Contracts\VideoServiceInterface;
use Modules\Media\Http\Requests\VideoUploadRequest;
use Modules\Media\Models\Video;

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

    public function upload(VideoUploadRequest $request): JsonResponse
    {
        $video = $this->videoService->dispatchUpload(
            $request->file('video'),
            $request->input('directory', 'videos'),
        );

        return response()->json([
            'message' => 'Video queued for processing',
            'data' => $this->formatVideo($video),
        ], 202);
    }

    public function uploadMultiple(VideoUploadRequest $request): JsonResponse
    {
        $videos = $this->videoService->dispatchMultipleUploads(
            $request->file('videos'),
            $request->input('directory', 'videos'),
        );

        return response()->json([
            'message' => 'Videos queued for processing',
            'data' => [
                'queued' => count($videos),
                'videos' => array_map(fn (Video $v) => $this->formatVideo($v), $videos),
            ],
        ], 202);
    }

    public function show(Video $video): JsonResponse
    {
        return response()->json([
            'data' => $video,
        ]);
    }

    public function destroy(Video $video): JsonResponse
    {
        $this->videoService->deleteVideo($video->id);

        return response()->json([
            'message' => 'Video deleted successfully',
        ]);
    }

    public function updateMetadata(Request $request, Video $video): JsonResponse
    {
        $request->validate([
            'metadata' => 'required|array',
        ]);

        $video = $this->videoService->updateMetadata($video->id, $request->input('metadata'));

        return response()->json([
            'message' => 'Video metadata updated successfully',
            'data' => $video,
        ]);
    }

    protected function formatVideo(Video $video): array
    {
        return [
            'id' => $video->id,
            'filename' => $video->filename,
            'original_filename' => $video->original_filename,
            'url' => $video->url,
            'cdn_url' => $video->cdn_url,
            'size' => $video->size,
            'human_size' => $video->human_size,
            'status' => $video->status,
            'mime_type' => $video->mime_type,
        ];
    }
}
