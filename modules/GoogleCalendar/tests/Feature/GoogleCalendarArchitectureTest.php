<?php

namespace Modules\GoogleCalendar\Tests\Feature;

use Tests\TestCase;

class GoogleCalendarArchitectureTest extends TestCase
{
    public function test_google_calendar_production_code_does_not_import_private_clinic_or_scheduling_models(): void
    {
        $contents = $this->googleCalendarProductionContents();

        $this->assertStringNotContainsString('Modules\\Clinic\\Models\\', $contents);
        $this->assertStringNotContainsString('Modules\\ClinicScheduling\\Models\\', $contents);
        $this->assertStringNotContainsString('Modules\\ClinicScheduling\\Enums\\', $contents);
    }

    public function test_google_calendar_production_code_does_not_call_force_fill(): void
    {
        $this->assertStringNotContainsString('forceFill(', $this->googleCalendarProductionContents());
    }

    public function test_google_calendar_service_interface_exposes_no_foreign_models(): void
    {
        $contents = file_get_contents(module_path('GoogleCalendar', 'app/Contracts/GoogleCalendarServiceInterface.php'));

        $this->assertStringNotContainsString('ClinicUser', $contents);
        $this->assertStringNotContainsString('Appointment $', $contents);
    }

    public function test_required_public_contracts_exist_as_interfaces(): void
    {
        foreach ([
            \Modules\Clinic\Contracts\Public\ClinicUserGoogleConnectionReadServiceInterface::class,
            \Modules\Clinic\Contracts\Public\GoogleCalendarConnectionWriteServiceInterface::class,
            \Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface::class,
            \Modules\ClinicScheduling\Contracts\Public\AppointmentSyncWriteServiceInterface::class,
            \Modules\ClinicScheduling\Contracts\Public\AppointmentUpsertFromExternalSourceInterface::class,
            \Modules\ClinicScheduling\Contracts\Public\AppointmentCancelFromExternalSourceInterface::class,
        ] as $contract) {
            $this->assertTrue(interface_exists($contract), "{$contract} must exist as a public contract interface.");
        }
    }

    public function test_google_calendar_routes_keep_existing_paths_and_controller(): void
    {
        $routes = collect(app('router')->getRoutes())->map(fn ($route) => [
            'uri'    => $route->uri(),
            'action' => $route->getActionName(),
        ]);

        foreach ([
            'api/clinic/google-calendar/callback',
            'api/clinic/google-calendar/connect',
            'api/clinic/google-calendar/status',
            'api/clinic/google-calendar',
        ] as $uri) {
            $match = $routes->firstWhere('uri', $uri);

            $this->assertNotNull($match, "Expected route {$uri} to exist.");
            $this->assertStringContainsString('Modules\\GoogleCalendar\\Http\\Controllers\\GoogleCalendarController', $match['action']);
        }
    }

    public function test_google_calendar_jobs_and_listener_do_not_import_private_models_or_scheduling_enums(): void
    {
        foreach ([
            module_path('GoogleCalendar', 'app/Jobs/SyncAppointmentToGoogleJob.php'),
            module_path('GoogleCalendar', 'app/Jobs/PullGoogleCalendarJob.php'),
            module_path('GoogleCalendar', 'app/Listeners/SyncSchedulingToGoogle.php'),
        ] as $path) {
            $contents = file_get_contents($path);

            $this->assertStringNotContainsString('Modules\\Clinic\\Models\\', $contents);
            $this->assertStringNotContainsString('Modules\\ClinicScheduling\\Models\\', $contents);
            $this->assertStringNotContainsString('Modules\\ClinicScheduling\\Enums\\', $contents);
        }
    }

    private function googleCalendarProductionContents(): string
    {
        $contents = '';

        foreach ($this->productionPhpFiles(module_path('GoogleCalendar', 'app')) as $path) {
            $contents .= file_get_contents($path) . PHP_EOL;
        }

        return $contents;
    }

    /**
     * @return array<int, string>
     */
    private function productionPhpFiles(string $directory): array
    {
        $files = [];

        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($directory));

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $files[] = $file->getPathname();
            }
        }

        sort($files);

        return $files;
    }
}
