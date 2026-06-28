<?php

namespace Modules\ClinicScheduling\Tests\Feature;

use Illuminate\Support\Facades\Route as RouteFacade;
use Tests\TestCase;

class SchedulingRouteCompatibilityTest extends TestCase
{
    public function test_appointment_route_paths_and_methods_remain_compatible(): void
    {
        $routes = $this->appointmentRouteMethodsByUri();

        $this->assertSame(array_keys($this->expectedAppointmentMethodsByUri()), array_keys($routes));

        foreach ($this->expectedAppointmentMethodsByUri() as $uri => $methods) {
            sort($methods);
            $this->assertSame($methods, $routes[$uri]['methods'], "Unexpected methods for {$uri}");

            foreach ($routes[$uri]['owners'] as $owner) {
                $this->assertStringStartsWith(
                    'Modules\\ClinicScheduling\\Http\\Controllers\\Appointment',
                    $owner,
                    "Unexpected route owner for {$uri}",
                );
            }
        }
    }

    /**
     * @return array<string, array{methods: array<int, string>, owners: array<int, string>}>
     */
    protected function appointmentRouteMethodsByUri(): array
    {
        $routes = [];

        foreach (RouteFacade::getRoutes() as $route) {
            if (str_starts_with($route->uri(), 'api/clinic/appointments')) {
                $routes[$route->uri()] ??= ['methods' => [], 'owners' => []];
                $routes[$route->uri()]['methods'] = array_values(array_unique(array_merge(
                    $routes[$route->uri()]['methods'],
                    $route->methods(),
                )));
                $routes[$route->uri()]['owners'][] = $route->getActionName();
            }
        }

        foreach ($routes as $uri => $route) {
            sort($route['methods']);
            sort($route['owners']);
            $routes[$uri] = $route;
        }

        ksort($routes);

        return $routes;
    }

    /**
     * @return array<string, array<int, string>>
     */
    protected function expectedAppointmentMethodsByUri(): array
    {
        return [
            'api/clinic/appointments'                       => ['GET', 'HEAD', 'POST'],
            'api/clinic/appointments/{appointment}'         => ['GET', 'HEAD', 'PUT'],
            'api/clinic/appointments/{appointment}/cancel'  => ['POST'],
            'api/clinic/appointments/{appointment}/status'  => ['PATCH'],
        ];
    }
}
