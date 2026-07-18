<?php

namespace Modules\Admin\Services;

use Illuminate\Support\Facades\DB;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\ExerciseMedia;

/**
 * Sincroniza imagens de referência do PDF em admin_exercise_media
 * a partir de um vídeo (exercícios ligados via admin_exercise_video).
 */
class ExerciseReferenceImageSyncService
{
    /**
     * @param  list<array{file_path: string, cdn_url: string, original_filename?: string, mime_type?: string, size?: int}>  $images
     */
    public function syncFromVideo(int $videoId, array $images): void
    {
        $images = array_values(array_slice($images, 0, 2));

        $exerciseIds = DB::table('admin_exercise_video')
            ->where('video_id', $videoId)
            ->pluck('exercise_id');

        foreach ($exerciseIds as $exerciseId) {
            $this->replaceImagesForExercise((int) $exerciseId, $images);
        }
    }

    /**
     * @param  list<array{file_path: string, cdn_url: string, original_filename?: string, mime_type?: string, size?: int}>  $images
     */
    public function replaceImagesForExercise(int $exerciseId, array $images): void
    {
        $exercise = Exercise::query()->find($exerciseId);
        if (is_null($exercise)) {
            return;
        }

        ExerciseMedia::query()
            ->where('exercise_id', $exerciseId)
            ->where('type', ExerciseMedia::TYPE_IMAGE)
            ->delete();

        foreach (array_values($images) as $index => $image) {
            if ($index > 1) {
                break;
            }
            if (empty($image['file_path']) || empty($image['cdn_url'])) {
                continue;
            }

            ExerciseMedia::query()->create([
                'exercise_id'       => $exerciseId,
                'type'              => ExerciseMedia::TYPE_IMAGE,
                'file_path'         => $image['file_path'],
                'cdn_url'           => $image['cdn_url'],
                'original_filename' => $image['original_filename'] ?? basename($image['file_path']),
                'mime_type'         => $image['mime_type'] ?? 'image/jpeg',
                'size'              => $image['size'] ?? 0,
                'sort_order'        => $index,
            ]);
        }
    }
}
