<?php

namespace Modules\Media\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Media\Models\Video;

class VideoSeeder extends Seeder
{
    /**
     * Imagens de referência do PDF (mesmos arquivos no R2).
     * Espelhadas em metadata.reference_images para a tela Editar vídeo
     * e sincronizadas com admin_exercise_media pelo ExerciseSeeder / sync API.
     */
    private const REFERENCE_IMAGES = [
        [
            'file'     => '139645c7-fa38-4679-a24c-2c3113a8fecc_1783782292.jpeg',
            'mime'     => 'image/jpeg',
            'filename' => 'referencia-1.jpeg',
        ],
        [
            'file'     => '31fa195c-d9f5-49e6-bb57-78da4d32b932_1783558953.png',
            'mime'     => 'image/png',
            'filename' => 'referencia-2.png',
        ],
    ];

    /**
     * Vídeos reais hospedados no bucket R2 (fisioweb), com thumbnail.
     * Os exercícios do ExerciseSeeder referenciam estes vídeos pelos ids 1 e 2.
     */
    public function run(): void
    {
        $cdn = rtrim(config('cloudflare.cdn_url', 'https://pub-c505783a14d2470eb49d00e4e17df019.r2.dev'), '/');

        // Chaveado por id (1 e 2) para preservar as referências do ExerciseSeeder
        // mesmo quando os arquivos do bucket são trocados.
        $videos = [
            1 => [
                'filename'          => 'bf6fd593-97ff-4bc2-be31-469a5e0a6c00_1783782291.mp4',
                'original_filename' => 'ponte-gluteo.mp4',
                'thumbnail'         => '31fa195c-d9f5-49e6-bb57-78da4d32b932_1783558953.png',
                'duration'          => 45,
            ],
            2 => [
                'filename'          => '7cb1e772-ea99-4564-9478-82198e60d9eb_1783558952.mp4',
                'original_filename' => 'bird-dog.mp4',
                'thumbnail'         => '139645c7-fa38-4679-a24c-2c3113a8fecc_1783782292.jpeg',
                'duration'          => 60,
            ],
        ];

        $referenceImages = collect(self::REFERENCE_IMAGES)->map(function (array $image) use ($cdn) {
            $path = 'thumbnails/videos/' . $image['file'];

            return [
                'file_path'         => $path,
                'cdn_url'           => $cdn . '/' . $path,
                'original_filename' => $image['filename'],
                'mime_type'         => $image['mime'],
                'size'              => 102400,
            ];
        })->all();

        foreach ($videos as $id => $data) {
            $path          = 'videos/' . $data['filename'];
            $thumbnailPath = 'thumbnails/videos/' . $data['thumbnail'];

            Video::withTrashed()->updateOrCreate(
                ['id' => $id],
                [
                    'filename'          => $data['filename'],
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
                    'metadata'          => [
                        'reference_images' => $referenceImages,
                    ],
                    'deleted_at'        => null,
                ],
            );
        }

        $this->command->info('Vídeos do R2 criados: ' . count($videos) . ' (com 2 imagens de referência cada)');
    }
}
