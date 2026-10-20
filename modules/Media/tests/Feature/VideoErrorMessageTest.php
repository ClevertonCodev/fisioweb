<?php

namespace Modules\Media\Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Modules\Admin\Models\User as AdminUser;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Contracts\VideoServiceInterface;
use Modules\Media\Models\Video;
use Tests\TestCase;

class VideoErrorMessageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.debug' => true]);
    }

    public function test_arquivo_ausente_no_storage_responde_422_com_a_mensagem(): void
    {
        $admin = AdminUser::factory()->create();
        $video = Video::factory()->create(['status' => Video::STATUS_PENDING, 'path' => 'videos/x.mp4']);

        $fileService = Mockery::mock(FileServiceInterface::class);
        $fileService->shouldReceive('fileExists')->andReturnFalse();
        $this->app->instance(FileServiceInterface::class, $fileService);

        $this->actingAs($admin, 'admin')
            ->postJson("/api/admin/media/videos/{$video->id}/confirm-upload")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Arquivo não encontrado no storage. O upload pode ter falhado.');
    }

    public function test_erro_de_banco_nao_volta_como_422_com_sql(): void
    {
        $admin = AdminUser::factory()->create();

        $service = Mockery::mock(VideoServiceInterface::class);
        $service->shouldReceive('updateVideo')->andThrow(
            new QueryException('pgsql', 'update "media_videos" set x = 1', [], new \PDOException('SQLSTATE[42703]'))
        );
        $this->app->instance(VideoServiceInterface::class, $service);

        $response = $this->actingAs($admin, 'admin')
            ->patchJson('/api/admin/media/videos/1', [])
            ->assertStatus(500)
            ->assertExactJson(['message' => 'Ocorreu um erro inesperado. Tente novamente em instantes.']);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }
}
