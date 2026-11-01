<?php

namespace Modules\Patient\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

/**
 * Busca por nome: o termo é texto, não padrão do LIKE. "%" e "_" (e o caractere de escape)
 * valem só por eles mesmos, e a busca nunca sai da clínica.
 */
class PatientRepositorySearchNamesTest extends TestCase
{
    use RefreshDatabase;

    public function test_like_wildcards_in_the_term_are_literal(): void
    {
        $clinic  = Clinic::factory()->create();
        $maria   = Patient::factory()->create(['clinic_id' => $clinic->id, 'name' => 'Maria Souza']);
        $percent = Patient::factory()->create(['clinic_id' => $clinic->id, 'name' => 'Paula 100%']);
        $under   = Patient::factory()->create(['clinic_id' => $clinic->id, 'name' => 'Ana_Lima']);
        $bang    = Patient::factory()->create(['clinic_id' => $clinic->id, 'name' => 'Zé!Ana']);
        $slash   = Patient::factory()->create(['clinic_id' => $clinic->id, 'name' => 'Rui \\ Costa']);
        Patient::factory()->create(['clinic_id' => Clinic::factory()->create()->id, 'name' => 'Outra 100%']);

        $cases = [
            '%%'    => [],
            '100%'  => [$percent->id],
            'a_s'   => [],
            'a_l'   => [$under->id],
            'é!a'   => [$bang->id],
            '\\'    => [$slash->id],
            'MARIA' => [$maria->id],
        ];

        $repository = app(PatientRepositoryInterface::class);
        foreach ($cases as $term => $expected) {
            $found = $repository->searchNamesForClinic($clinic->id, $term, 20)->pluck('id')->map(fn ($id) => (int) $id)->all();
            $this->assertSame($expected, $found, "busca por {$term}");
        }
    }
}
