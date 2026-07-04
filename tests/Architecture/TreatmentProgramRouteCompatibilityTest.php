<?php

namespace Tests\Architecture;

use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Garante que a extração de TreatmentProgram preservou o contrato REST:
 * mesmos paths e nomes de rota, controllers no namespace do módulo dono, e
 * nenhuma rota de prescrição remanescente/duplicada no módulo Clinic.
 */
class TreatmentProgramRouteCompatibilityTest extends TestCase
{
    /**
     * @return array<int, array{0: string, 1: string, 2: string}>
     */
    public static function prescriptionRoutes(): array
    {
        return [
            // [route name, method, uri]
            ['api.clinic.treatment-plans.index', 'GET', 'api/clinic/treatment-plans'],
            ['api.clinic.treatment-plans.pdf', 'GET', 'api/clinic/treatment-plans/{id}/pdf'],
            ['api.clinic.treatment-plans.show', 'GET', 'api/clinic/treatment-plans/{id}'],
            ['api.clinic.treatment-plans.store', 'POST', 'api/clinic/treatment-plans'],
            ['api.clinic.treatment-plans.update', 'PUT', 'api/clinic/treatment-plans/{id}'],
            ['api.clinic.treatment-plans.destroy', 'DELETE', 'api/clinic/treatment-plans/{id}'],
            ['api.clinic.treatment-plans.duplicate', 'POST', 'api/clinic/treatment-plans/{id}/duplicate'],
            ['api.clinic.treatment-plans.to-model', 'POST', 'api/clinic/treatment-plans/{id}/to-model'],
            ['api.clinic.program-drafts.show', 'GET', 'api/clinic/program-drafts'],
            ['api.clinic.program-drafts.upsert', 'PUT', 'api/clinic/program-drafts'],
            ['api.clinic.program-drafts.destroy', 'DELETE', 'api/clinic/program-drafts'],
            ['api.clinic.programs.index', 'GET', 'api/clinic/programs'],
            ['api.clinic.programs.show', 'GET', 'api/clinic/programs/{id}'],
        ];
    }

    #[DataProvider('prescriptionRoutes')]
    public function test_prescription_route_exists_with_same_path_and_owner_controller(string $name, string $method, string $uri): void
    {
        $route = Route::getRoutes()->getByName($name);

        $this->assertNotNull($route, "Route {$name} must exist with the same name after extraction.");
        $this->assertSame($uri, $route->uri(), "Route {$name} must keep the same URI.");
        $this->assertContains($method, $route->methods(), "Route {$name} must keep the {$method} method.");
        $this->assertStringStartsWith(
            'Modules\\TreatmentProgram\\Http\\Controllers\\',
            $route->getActionName(),
            "Route {$name} must be owned by a TreatmentProgram controller.",
        );
    }

    public function test_clinic_module_has_no_prescription_routes_or_controllers(): void
    {
        $clinicRoutes = (string) file_get_contents(dirname(__DIR__, 2) . '/modules/Clinic/routes/clinic.php');

        $this->assertStringNotContainsString('treatment-plans', $clinicRoutes);
        $this->assertStringNotContainsString('program-drafts', $clinicRoutes);
        $this->assertStringNotContainsString('TreatmentPlanController', $clinicRoutes);
        $this->assertStringNotContainsString('ProgramDraftController', $clinicRoutes);
        $this->assertStringNotContainsString('SharedProgramController', $clinicRoutes);
        // 'programs' (SharedProgramController) route também não deve existir no Clinic.
        $this->assertStringNotContainsString("'programs'", $clinicRoutes);
    }
}
