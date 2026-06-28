# Public Contracts (cross-module consumption)

Contrato público de leitura exposto por `ClinicScheduling` para módulos consumidores (hoje: Dashboard e OccupancyRate, ambos em `Clinic`). Vive em `Modules\ClinicScheduling\Contracts\Public`.

Consumidores importam **somente esta interface** (não o Model, Repository ou Service interno). Satisfaz FR-018.

## SchedulingReadServiceInterface

```php
namespace Modules\ClinicScheduling\Contracts\Public;

use Carbon\CarbonInterface;

interface SchedulingReadServiceInterface
{
    /** Consultas não-canceladas de hoje (timezone da clínica). */
    public function appointmentsTodayCount(int $clinicId, ?int $clinicUserId, string $timezone): int;

    /**
     * Próximas consultas de hoje, já no shape do dashboard.
     * @return array<int, array{
     *   id:int, patient_name:string, patient_photo_url:?string,
     *   title:?string, starts_at:?string, status:?string
     * }>
     */
    public function upcomingAppointmentsToday(int $clinicId, ?int $clinicUserId, string $timezone, int $limit = 5): array;

    /**
     * Intervalos (start/end) de consultas não-canceladas de um profissional num período,
     * para cálculo de taxa de ocupação.
     * @return array<int, array{starts_at: CarbonInterface, ends_at: CarbonInterface}>
     */
    public function occupancyIntervals(int $clinicId, int $clinicUserId, CarbonInterface $rangeStart, CarbonInterface $rangeEnd): array;
}
```

## Implementação

`Modules\ClinicScheduling\Services\SchedulingReadService implements SchedulingReadServiceInterface`, usando `AppointmentRepositoryInterface` (ou queries próprias no Repository). A lógica de timezone (start/end of day no tz da clínica convertido para `config('app.timezone')`) e o filtro `status != cancelled` movem-se de `DashboardRepository`/`OccupancyRateService` para cá — preservando os mesmos resultados.

## Adaptação dos consumidores (em Clinic)

- `DashboardRepository`: injeta `SchedulingReadServiceInterface`; `appointmentsTodayCount()` e `upcomingAppointmentsToday()` delegam. Remove `use Modules\Clinic\Models\Appointment` e `use Modules\Clinic\Enums\AppointmentStatus`.
- `OccupancyRateService`: injeta `SchedulingReadServiceInterface`; substitui `Appointment::query()...->get(['starts_at','ends_at'])` por `occupancyIntervals(...)`. Remove os mesmos imports.

## Boundary

- Consumidor importa `Modules\ClinicScheduling\Contracts\Public\SchedulingReadServiceInterface` — **não** é flagrado pelo `ModuleBoundaryTest` (não é `Models\`, `Repositories\`, nem `*RepositoryInterface`).
- `ClinicScheduling` não importa nada privado de Clinic/Patient em produção (apenas FQN inline nas relações do Model).
