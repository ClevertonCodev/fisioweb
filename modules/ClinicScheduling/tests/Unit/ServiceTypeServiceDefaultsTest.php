<?php

namespace Modules\ClinicScheduling\Tests\Unit;

use Illuminate\Database\Eloquent\Collection;
use Mockery;
use Modules\ClinicScheduling\Contracts\ServiceTypeRepositoryInterface;
use Modules\ClinicScheduling\Services\ServiceTypeService;
use Tests\TestCase;

class ServiceTypeServiceDefaultsTest extends TestCase
{
    /**
     * Corrida: a primeira checagem vê a clínica vazia, mas outra requisição
     * grava os padrão antes de esta pegar o lock. A checagem dentro do lock
     * precisa impedir a segunda gravação.
     */
    public function test_defaults_are_not_written_twice_when_another_request_seeds_first(): void
    {
        $repository = Mockery::mock(ServiceTypeRepositoryInterface::class);
        $repository->shouldReceive('clinicHasAnyIncludingDeleted')
            ->with(7)
            ->twice()
            ->andReturn(false, true);
        $repository->shouldNotReceive('create');
        $repository->shouldReceive('listForClinic')->with(7)->once()->andReturn(new Collection);

        (new ServiceTypeService($repository))->listForClinic(7);
    }

    public function test_defaults_are_written_once_for_a_clinic_that_never_had_types(): void
    {
        $repository = Mockery::mock(ServiceTypeRepositoryInterface::class);
        $repository->shouldReceive('clinicHasAnyIncludingDeleted')->with(7)->twice()->andReturn(false, false);
        $repository->shouldReceive('create')->times(count(ServiceTypeService::DEFAULTS));
        $repository->shouldReceive('listForClinic')->with(7)->once()->andReturn(new Collection);

        (new ServiceTypeService($repository))->listForClinic(7);
    }
}
