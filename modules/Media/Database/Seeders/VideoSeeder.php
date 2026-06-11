<?php

namespace Modules\Media\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Media\Models\Video;

class VideoSeeder extends Seeder
{
    /**
     * Vídeos reais hospedados no bucket R2 (fisioweb), com thumbnail.
     * Os exercícios do ExerciseSeeder referenciam estes vídeos pelos ids 1 e 2.
     */
    public function run(): void
    {
        $cdn = rtrim(config('cloudflare.cdn_url', 'https://pub-c505783a14d2470eb49d00e4e17df019.r2.dev'), '/');

        $videos = [
            [
                'filename'          => '71c65daf-4c7c-42ca-b409-3b83ba50b0f2_1773551152.mp4',
                'original_filename' => 'ponte-gluteo.mp4',
                'thumbnail'         => 'e8d9f13b-0042-4371-8cf6-bb822b3f2fef_1773551154.jpeg',
                'duration'          => 45,
            ],
            [
                'filename'          => '229bd21a-c21a-422c-8918-5e21a1fc6330_1773552565.mp4',
                'original_filename' => 'bird-dog.mp4',
                'thumbnail'         => 'ea2f1521-0b40-4c69-a5e3-a014d624a120_1773552566.jpeg',
                'duration'          => 60,
            ],
        ];

        foreach ($videos as $data) {
            $path          = 'videos/' . $data['filename'];
            $thumbnailPath = 'thumbnails/videos/' . $data['thumbnail'];

            Video::withTrashed()->updateOrCreate(
                ['filename' => $data['filename']],
                [
                    'original_filename' => $data['original_filename'],
                    'path'              => $path,
                    'url'               => $cdn . '/' . $path,
                    'cdn_url'           => $cdn . '/' . $path,
                    'mime_type'         => 'video/mp4',
                    'size'              => 5242880,
                    'duration'          => $data['duration'],
                    'width'             => 1920,
                    'height'            => 1080,
                    'thumbnail_path'    => $thumbnailPath,
                    'thumbnail_url'     => $cdn . '/' . $thumbnailPath,
                    'status'            => Video::STATUS_COMPLETED,
                    'metadata'          => [],
                    'deleted_at'        => null,
                ],
            );
        }

        $this->command->info('Vídeos do R2 criados: ' . count($videos));
    }
}
