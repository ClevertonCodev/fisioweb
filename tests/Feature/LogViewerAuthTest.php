<?php

namespace Tests\Feature;

use Tests\TestCase;

class LogViewerAuthTest extends TestCase
{
    public function test_production_without_remote_user_returns_403(): void
    {
        $this->app['env'] = 'production';

        $this->get('/log-viewer')->assertForbidden();
        $this->getJson('/log-viewer/api/files')->assertForbidden();
        $this->deleteJson('/log-viewer/api/files/qualquer')->assertForbidden();
    }

    public function test_production_with_remote_user_returns_200(): void
    {
        $this->app['env'] = 'production';

        $this->withServerVariables(['REMOTE_USER' => 'operador'])
            ->getJson('/log-viewer/api/files')
            ->assertOk();
    }

    public function test_local_without_remote_user_returns_200(): void
    {
        $this->app['env'] = 'local';

        $this->getJson('/log-viewer/api/files')->assertOk();
    }

    public function test_production_client_remote_user_header_returns_403(): void
    {
        $this->app['env'] = 'production';

        $this->withHeader('Remote-User', 'operador')
            ->getJson('/log-viewer/api/files')
            ->assertForbidden();
    }

    public function test_production_with_empty_remote_user_returns_403(): void
    {
        $this->app['env'] = 'production';

        $this->withServerVariables(['REMOTE_USER' => ''])
            ->getJson('/log-viewer/api/files')
            ->assertForbidden();
    }

    public function test_provision_script_protects_log_viewer_without_a_fixed_secret(): void
    {
        $script = file_get_contents(base_path('infra/provision.sh'));

        $this->assertIsString($script);
        $this->assertStringContainsString('LOG_LEVEL=info', $script);
        $this->assertStringNotContainsString('LOG_LEVEL=debug', $script);
        $this->assertStringContainsString('location ~ ^/log-viewer(/|\$) {', $script);
        $this->assertStringContainsString('auth_basic "Logs";', $script);
        $this->assertStringContainsString('auth_basic_user_file $LOG_VIEWER_HTPASSWD;', $script);
        $this->assertStringContainsString('fastcgi_param REMOTE_USER \$remote_user;', $script);
        $this->assertStringContainsString('usuário: $LOG_VIEWER_USER', $script);
        $this->assertStringContainsString('senha: $LOG_VIEWER_PASSWORD', $script);
        $this->assertStringNotContainsString('$http_remote_user', $script);
        $this->assertMatchesRegularExpression(
            '/LOG_VIEWER_PASSWORD="\$\(openssl rand [^"]+\)"/',
            $script,
        );
        $this->assertStringContainsString('[[ ! -f "$LOG_VIEWER_HTPASSWD" ]]', $script);
        preg_match_all('/^\s*LOG_VIEWER_PASSWORD="(.*)"$/m', $script, $passwords);
        $this->assertSame(['', '$(openssl rand -base64 18)'], $passwords[1]);
    }

    public function test_existing_server_checklist_is_written(): void
    {
        $doc = file_get_contents(base_path('infra/README.md'));

        $this->assertIsString($doc);
        $this->assertStringContainsString('## Log-viewer no servidor que já existe', $doc);
        $this->assertStringContainsString('htpasswd', $doc);
        $this->assertStringContainsString('auth_basic', $doc);
        $this->assertStringContainsString('REMOTE_USER', $doc);
        $this->assertStringContainsString('LOG_LEVEL=info', $doc);
        $this->assertStringContainsString('401', $doc);
        $this->assertStringContainsString('200', $doc);
    }
}
