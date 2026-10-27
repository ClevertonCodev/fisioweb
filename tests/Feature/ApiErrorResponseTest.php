<?php

namespace Tests\Feature;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Route;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Tests\TestCase;

class ApiErrorResponseTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['app.debug' => true]);

        Route::get('/api/_teste/erro-banco', function () {
            throw new QueryException('pgsql', 'select * from "clinic_users" where "deleted_at" is null', [], new \PDOException('SQLSTATE[42703]: Undefined column'));
        });
        Route::get('/api/_teste/erro-geral', function () {
            throw new \RuntimeException('Failed to upload file: bucket secreto');
        });
        Route::get('/api/_teste/sem-registro', function () {
            throw (new ModelNotFoundException)->setModel(ClinicUser::class, [7]);
        });
        Route::get('/api/_teste/proibido', function () {
            abort(403, 'Seu acesso está desativado.');
        });
        Route::get('/api/_teste/manutencao', function () {
            abort(503, 'Banco em manutenção: pgsql db:5432', ['Retry-After' => 60]);
        });
        Route::get('/api/_teste/sem-mensagem', function () {
            abort(419);
        });
        Route::get('/api/_teste/enum/{metodo}', function (PaymentMethod $metodo) {
            return $metodo->value;
        })->middleware(\Illuminate\Routing\Middleware\SubstituteBindings::class);
        Route::get('/api/_teste/validacao', function () {
            request()->validate(['email' => ['required']]);
        });
    }

    public function test_erro_de_banco_responde_mensagem_generica_mesmo_com_debug(): void
    {
        Exceptions::fake();

        $response = $this->getJson('/api/_teste/erro-banco')
            ->assertStatus(500)
            ->assertExactJson(['message' => 'Ocorreu um erro inesperado. Tente novamente em instantes.']);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
        $this->assertStringNotContainsString('clinic_users', $response->getContent());
        Exceptions::assertReported(QueryException::class);
    }

    public function test_5xx_intencional_mantem_status_e_headers_com_mensagem_generica(): void
    {
        $this->getJson('/api/_teste/manutencao')
            ->assertStatus(503)
            ->assertHeader('Retry-After', '60')
            ->assertExactJson(['message' => 'Ocorreu um erro inesperado. Tente novamente em instantes.']);
    }

    public function test_4xx_sem_mensagem_nem_texto_padrao_usa_mensagem_de_reserva(): void
    {
        $this->getJson('/api/_teste/sem-mensagem')
            ->assertStatus(419)
            ->assertExactJson(['message' => 'Não foi possível concluir a requisição.']);
    }

    public function test_enum_invalido_na_rota_nao_expoe_nome_da_classe(): void
    {
        $response = $this->getJson('/api/_teste/enum/zzz')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Registro não encontrado.']);

        $this->assertStringNotContainsString('PaymentMethod', $response->getContent());
    }

    public function test_excecao_qualquer_nao_vaza_mensagem_nem_trace(): void
    {
        $this->getJson('/api/_teste/erro-geral')
            ->assertStatus(500)
            ->assertExactJson(['message' => 'Ocorreu um erro inesperado. Tente novamente em instantes.']);
    }

    public function test_registro_inexistente_nao_expoe_nome_do_model(): void
    {
        $response = $this->getJson('/api/_teste/sem-registro')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Registro não encontrado.']);

        $this->assertStringNotContainsString('ClinicUser', $response->getContent());
    }

    public function test_erro_4xx_mantem_a_mensagem_sem_trace(): void
    {
        $this->getJson('/api/_teste/proibido')
            ->assertForbidden()
            ->assertExactJson(['message' => 'Seu acesso está desativado.']);
    }

    public function test_validacao_continua_com_os_erros_de_campo(): void
    {
        $this->getJson('/api/_teste/validacao')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
