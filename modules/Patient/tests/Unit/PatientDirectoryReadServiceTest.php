<?php

namespace Modules\Patient\Tests\Unit;

use Illuminate\Support\Collection;
use Mockery\MockInterface;
use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Services\PatientDirectoryReadService;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Busca por nome do contrato público: termo vazio não busca. "0" também não (é `empty`, como
 * a busca de Finanças, onde `q=0` não filtra nada).
 */
class PatientDirectoryReadServiceTest extends TestCase
{
    private MockInterface $repository;

    private PatientDirectoryReadService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = \Mockery::mock(PatientRepositoryInterface::class);
        $this->service    = new PatientDirectoryReadService($this->repository);
    }

    protected function tearDown(): void
    {
        \Mockery::close();
        parent::tearDown();
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function blankTerms(): array
    {
        return [
            'vazio'           => [''],
            'espaços'         => ['   '],
            'zero'            => ['0'],
            'zero com espaço' => [' 0 '],
        ];
    }

    #[DataProvider('blankTerms')]
    public function test_a_blank_term_returns_nothing_without_querying(string $term): void
    {
        $this->repository->shouldNotReceive('searchNamesForClinic');

        $this->assertSame([], $this->service->searchByName(1, $term));
    }

    public function test_a_term_is_trimmed_and_searched_in_the_clinic(): void
    {
        $this->repository->shouldReceive('searchNamesForClinic')
            ->once()
            ->with(1, 'ana', 20, false)
            ->andReturn(new Collection([(object) ['id' => 7, 'name' => 'Ana']]));

        $found = $this->service->searchByName(1, ' ana ');

        $this->assertCount(1, $found);
        $this->assertSame(7, $found[0]->id);
        $this->assertSame('Ana', $found[0]->name);
    }
}
