<?php

namespace Modules\Clinic\Tests\Unit\Services;

use Modules\Admin\Contracts\Public\PlanCatalogReadServiceInterface;
use Modules\Clinic\Contracts\ClinicRepositoryInterface;
use Modules\Clinic\Services\ClinicRegistrationService;
use Tests\TestCase;

class ClinicRegistrationServiceTest extends TestCase
{
    public function test_check_slug_availability_distinguishes_invalid_reserved_taken_and_available(): void
    {
        $repository = $this->createMock(ClinicRepositoryInterface::class);
        $planReader = $this->createMock(PlanCatalogReadServiceInterface::class);

        $repository->expects($this->exactly(2))
            ->method('slugExistsWithTrashed')
            ->willReturnCallback(fn (string $slug): bool => $slug === 'clinica-ocupada');

        $service = new ClinicRegistrationService($repository, $planReader);

        $this->assertSame(
            ['available' => false, 'reason' => 'invalid'],
            $service->checkSlugAvailability('Invalido--Slug'),
        );

        $this->assertSame(
            ['available' => false, 'reason' => 'reserved'],
            $service->checkSlugAvailability('  ADMIN  '),
        );

        $this->assertSame(
            ['available' => false, 'reason' => 'taken'],
            $service->checkSlugAvailability('clinica-ocupada'),
        );

        $this->assertSame(
            ['available' => true, 'reason' => null],
            $service->checkSlugAvailability('clinica-livre'),
        );
    }
}
