<?php

namespace Modules\Cloudflare\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Cloudflare\Http\Requests\VideoUploadRequest;
use Modules\Cloudflare\Services\CloudflareR2Service;

class VideoController extends Controller
{
    protected CloudflareR2Service $videoService;

    public function __construct(CloudflareR2Service $videoService)
    {
        $this->videoService = $videoService;
    }

    /**
     * Upload a single video.
     */
    public function upload(VideoUploadRequest $request): JsonResponse
    {
        try {
            $video = $this->videoService->uploadVideo(
                $request->file('video'),
                $request->input('directory', 'videos'),
                null // You can pass a model instance here if needed
            );

            return response()->json([
                'success' => true,
                'message' => 'Video uploaded successfully',
                'data' => [
                    'id' => $video->id,
                    'filename' => $video->filename,
                    'original_filename' => $video->original_filename,
                    'url' => $video->url,
                    'cdn_url' => $video->cdn_url,
                    'size' => $video->size,
                    'human_size' => $video->human_size,
                    'status' => $video->status,
                    'mime_type' => $video->mime_type,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload video',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload multiple videos.
     */
    public function uploadMultiple(Request $request): JsonResponse
    {
        $request->validate([
            'videos' => 'required|array|min:1|max:10',
            'videos.*' => 'required|file|mimes:mp4,mpeg,mov,avi,webm|max:512000',
            'directory' => 'nullable|string',
        ]);

        try {
            $result = $this->videoService->uploadMultipleVideos(
                $request->file('videos'),
                $request->input('directory', 'videos')
            );

            return response()->json([
                'success' => true,
                'message' => 'Videos upload completed',
                'data' => [
                    'uploaded' => count($result['success']),
                    'failed' => count($result['errors']),
                    'videos' => $result['success'],
                    'errors' => $result['errors'],
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload videos',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get video details.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $video = $this->videoService->getVideo($id);

            if (!$video) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $video,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve video',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a video.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->videoService->deleteVideo($id);

            return response()->json([
                'success' => true,
                'message' => 'Video deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete video',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all videos with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->input('per_page', 15);
            $videos = $this->videoService->getAllVideos($perPage);

            return response()->json([
                'success' => true,
                'data' => $videos,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve videos',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update video metadata.
     */
    public function updateMetadata(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'metadata' => 'required|array',
        ]);

        try {
            $video = $this->videoService->updateMetadata($id, $request->input('metadata'));

            return response()->json([
                'success' => true,
                'message' => 'Video metadata updated successfully',
                'data' => $video,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update video metadata',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
