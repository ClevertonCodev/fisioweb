<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Support\Facades\Route as RouteFacade;
use Tests\TestCase;

class FinanceRouteCompatibilityTest extends TestCase
{
    public function test_finance_route_paths_and_methods_remain_compatible(): void
    {
        $routes = $this->financeRouteMethodsByUri();

        $this->assertSame(array_keys($this->expectedFinanceMethodsByUri()), array_keys($routes));

        foreach ($this->expectedFinanceMethodsByUri() as $uri => $methods) {
            sort($methods);
            $this->assertSame($methods, $routes[$uri]['methods'], "Unexpected methods for {$uri}");

            foreach ($routes[$uri]['owners'] as $owner) {
                $this->assertStringStartsWith(
                    'Modules\\ClinicFinance\\Http\\Controllers\\Financial',
                    $owner,
                    "Unexpected route owner for {$uri}",
                );
            }
        }
    }

    /**
     * @return array<string, array{methods: array<int, string>, owners: array<int, string>}>
     */
    protected function financeRouteMethodsByUri(): array
    {
        $routes = [];

        foreach (RouteFacade::getRoutes() as $route) {
            if (str_starts_with($route->uri(), 'api/clinic/finances')) {
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
    protected function expectedFinanceMethodsByUri(): array
    {
        return [
            'api/clinic/finances/categories'                          => ['GET', 'HEAD', 'POST'],
            'api/clinic/finances/categories/{category}'               => ['DELETE'],
            'api/clinic/finances/categories/{category}/toggle-active' => ['POST'],
            'api/clinic/finances/export'                              => ['GET', 'HEAD'],
            'api/clinic/finances/opening-balance'                     => ['PUT'],
            'api/clinic/finances/reports/category-breakdown'          => ['GET', 'HEAD'],
            'api/clinic/finances/reports/category-distribution'       => ['GET', 'HEAD'],
            'api/clinic/finances/reports/income-vs-expense'           => ['GET', 'HEAD'],
            'api/clinic/finances/reports/monthly-comparison'          => ['GET', 'HEAD'],
            'api/clinic/finances/reports/summary'                     => ['GET', 'HEAD'],
            'api/clinic/finances/summary'                             => ['GET', 'HEAD'],
            'api/clinic/finances/transactions'                        => ['GET', 'HEAD', 'POST'],
            'api/clinic/finances/transactions/trash'                  => ['GET', 'HEAD'],
            'api/clinic/finances/transactions/{id}/restore'           => ['POST'],
            'api/clinic/finances/transactions/{transaction}'          => ['GET', 'HEAD', 'PUT', 'PATCH', 'DELETE'],
        ];
    }
}
