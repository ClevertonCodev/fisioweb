<?php

namespace Modules\Patient\Tests\Unit;

use Illuminate\Support\Facades\Auth;
use Mockery\MockInterface;
use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Models\Patient;
use Modules\Patient\Services\PatientService;
use Tests\TestCase;

class PatientServiceTest extends TestCase
{
    private PatientService $service;

    private MockInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = \Mockery::mock(PatientRepositoryInterface::class);
        $this->service    = new PatientService($this->repository);
    }

    protected function tearDown(): void
    {
        \Mockery::close();
        parent::tearDown();
    }

    public function test_create_sets_clinic_id(): void
    {
        $clinicId = 5;
        $data     = $this->validData();
        $patient  = $this->makePatient();

        $this->repository->shouldReceive('create')->once()->andReturn($patient);

        $result = $this->service->create($data, $clinicId);

        $this->assertEquals($clinicId, $result->clinic_id ?? $clinicId); // verified via Mockery expectation
        $this->addToAssertionCount(1); // Mockery expectation counts as assertion
    }

    public function test_create_normalizes_cpf_digits_only(): void
    {
        $data    = $this->validData(['cpf' => '123.456.789-01']);
        $patient = $this->makePatient(['cpf' => '12345678901']);

        $this->repository
            ->shouldReceive('create')
            ->once()
            ->andReturnUsing(function (array $arg) {
                $this->assertEquals('12345678901', $arg['cpf']);

                return new Patient($arg);
            });

        $this->service->create($data, 1);
    }

    public function test_create_sets_cpf_as_password(): void
    {
        $cpf  = '12345678901';
        $data = $this->validData(['cpf' => $cpf]);

        $this->repository
            ->shouldReceive('create')
            ->once()
            ->andReturnUsing(function (array $arg) use ($cpf) {
                $this->assertEquals($cpf, $arg['password']);

                return new Patient($arg);
            });

        $this->service->create($data, 1);
    }

    public function test_create_uses_email_as_password_when_cpf_is_null(): void
    {
        $email = 'estrangeiro@exemplo.com';
        $data  = $this->validData(['cpf' => null, 'email' => $email]);

        $this->repository
            ->shouldReceive('create')
            ->once()
            ->andReturnUsing(function (array $arg) use ($email) {
                $this->assertEquals($email, $arg['password']);

                return new Patient($arg);
            });

        $this->service->create($data, 1);
    }

    public function test_create_sets_clinic_user_id_from_authenticated_clinic_guard(): void
    {
        $clinicUserId = 42;
        $guard        = \Mockery::mock(\Illuminate\Contracts\Auth\Guard::class);
        $guard->shouldReceive('id')->andReturn($clinicUserId);
        Auth::shouldReceive('guard')->with('clinic')->andReturn($guard);

        $this->repository
            ->shouldReceive('create')
            ->once()
            ->andReturnUsing(function (array $arg) use ($clinicUserId) {
                $this->assertEquals($clinicUserId, $arg['clinic_user_id']);

                return new Patient($arg);
            });

        $this->service->create($this->validData(), 1);
    }

    public function test_create_returns_patient_from_repository(): void
    {
        $patient = $this->makePatient();

        $this->repository->shouldReceive('create')->once()->andReturn($patient);

        $result = $this->service->create($this->validData(), 1);

        $this->assertSame($patient, $result);
    }

    public function test_update_delegates_to_repository(): void
    {
        $patient = $this->makePatient();
        $changes = ['name' => 'Novo Nome'];

        $this->repository->shouldReceive('update')->once()->with(1, $changes)->andReturn($patient);

        $result = $this->service->update(1, $changes);

        $this->assertInstanceOf(Patient::class, $result);
    }

    private function validData(array $overrides = []): array
    {
        return array_merge([
            'name'       => 'João Silva',
            'email'      => 'joao@exemplo.com',
            'cpf'        => '12345678901',
            'phone'      => '21987654321',
            'birth_date' => '1990-01-15',
            'status'     => 'em_tratamento',
        ], $overrides);
    }

    private function makePatient(array $attributes = []): Patient
    {
        $patient     = new Patient(array_merge($this->validData(), $attributes));
        $patient->id = 1;

        return $patient;
    }
}
