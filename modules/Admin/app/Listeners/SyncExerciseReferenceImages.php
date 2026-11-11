<?php

namespace Modules\Admin\Listeners;

use Modules\Admin\Services\ExerciseReferenceImageSyncService;
use Modules\Media\Events\VideoReferenceImagesChanged;

class SyncExerciseReferenceImages
{
    public function __construct(
        protected ExerciseReferenceImageSyncService $sync,
    ) {}

    public function handle(VideoReferenceImagesChanged $event): void
    {
        $this->sync->syncFromVideo(
            $event->videoId,
            $event->images,
            $event->changedByOperator,
            $event->ownerClinicId,
        );
    }
}
