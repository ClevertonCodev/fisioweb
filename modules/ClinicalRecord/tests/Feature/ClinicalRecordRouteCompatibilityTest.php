<?php

namespace Modules\ClinicalRecord\Tests\Feature;

use Illuminate\Support\Facades\Route as RouteFacade;
use Tests\TestCase;

class ClinicalRecordRouteCompatibilityTest extends TestCase
{
    public function test_clinical_record_route_paths_and_methods_remain_compatible(): void
    {
        $routes = $this->clinicalRecordRouteMethodsByUri();

        $this->assertSame(array_keys($this->expectedMethodsByUri()), array_keys($routes));

        foreach ($this->expectedMethodsByUri() as $uri => $methods) {
            sort($methods);
            $this->assertSame($methods, $routes[$uri]['methods'], "Unexpected methods for {$uri}");

            foreach ($routes[$uri]['owners'] as $owner) {
                $this->assertStringStartsWith(
                    'Modules\\ClinicalRecord\\Http\\Controllers\\',
                    $owner,
                    "Unexpected route owner for {$uri}",
                );
            }
        }
    }

    protected function clinicalRecordRouteMethodsByUri(): array
    {
        $routes = [];

        foreach (RouteFacade::getRoutes() as $route) {
            if (!str_starts_with($route->uri(), 'api/clinic/')) {
                continue;
            }

            if (
                !str_contains($route->uri(), '/assessments')
                && !str_contains($route->uri(), '/evolutions')
                && !str_contains($route->uri(), '/files')
                && !str_contains($route->uri(), 'assessment-templates')
                && !str_contains($route->uri(), 'evolution-templates')
            ) {
                continue;
            }

            $routes[$route->uri()] ??= ['methods' => [], 'owners' => []];
            $routes[$route->uri()]['methods'] = array_values(array_unique(array_merge(
                $routes[$route->uri()]['methods'],
                $route->methods(),
            )));
            $routes[$route->uri()]['owners'][] = $route->getActionName();
        }

        foreach ($routes as $uri => $route) {
            sort($route['methods']);
            sort($route['owners']);
            $routes[$uri] = $route;
        }

        ksort($routes);

        return $routes;
    }

    protected function expectedMethodsByUri(): array
    {
        return [
            'api/clinic/assessment-templates'              => ['GET', 'HEAD'],
            'api/clinic/assessment-templates/{id}'         => ['GET', 'HEAD'],
            'api/clinic/assessments/{id}'                  => ['DELETE', 'GET', 'HEAD', 'PUT'],
            'api/clinic/assessments/{id}/sign'             => ['POST'],
            'api/clinic/evolution-templates'               => ['GET', 'HEAD', 'POST'],
            'api/clinic/evolution-templates/{id}'          => ['DELETE', 'GET', 'HEAD', 'PUT'],
            'api/clinic/evolutions/{id}'                   => ['DELETE', 'GET', 'HEAD', 'PUT'],
            'api/clinic/evolutions/{id}/generate-text'     => ['POST'],
            'api/clinic/evolutions/{id}/pdf'               => ['GET', 'HEAD'],
            'api/clinic/evolutions/{id}/sign'              => ['POST'],
            'api/clinic/patients/{patient}/assessments'    => ['GET', 'HEAD', 'POST'],
            'api/clinic/patients/{patient}/evolutions'     => ['GET', 'HEAD', 'POST'],
            'api/clinic/patients/{patient}/files'          => ['GET', 'HEAD', 'POST'],
            'api/clinic/patients/{patient}/files/{file}'   => ['DELETE'],
        ];
    }
}
