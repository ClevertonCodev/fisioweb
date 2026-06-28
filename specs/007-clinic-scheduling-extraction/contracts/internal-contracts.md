# Internal Contracts (private to ClinicScheduling)

Interfaces internas do módulo (não são contratos públicos cross-module). Vivem em `Modules\ClinicScheduling\Contracts`.

## AppointmentRepositoryInterface

```php
namespace Modules\ClinicScheduling\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicScheduling\Models\Appointment;

interface AppointmentRepositoryInterface
{
    public function find(int $id): ?Appointment;
    public function findOrFail(int $id): Appointment;
    public function create(array $data): Appointment;
    public function update(int $id, array $data): Appointment;
    public function listForCalendar(int $clinicId, array $filters = []): Collection;
}
```

(Assinaturas idênticas às atuais em Clinic; apenas namespace muda.)

## AppointmentServiceInterface

```php
namespace Modules\ClinicScheduling\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Models\Appointment;

interface AppointmentServiceInterface
{
    public function create(array $data): Appointment;
    public function update(int $id, array $data): Appointment;
    public function updateStatus(int $id, AppointmentStatus $status): Appointment;
    public function cancel(int $id): Appointment;
    public function listForUser($user, array $filters = []): Collection;
}
```

> `listForUser` recebe o usuário autenticado do guard clinic. Para não importar `Modules\Clinic\Models\ClinicUser` via `use`, tipar como `$user` (sem type-hint) ou contrato leve. Comportamento preservado: se `$user->isPhysiotherapist()`, força `clinic_user_id` ao próprio id antes de delegar ao repository.

## Binding (ClinicSchedulingServiceProvider::register)

```php
$this->app->bind(AppointmentRepositoryInterface::class, AppointmentRepository::class);
$this->app->bind(AppointmentServiceInterface::class, AppointmentService::class);
$this->app->bind(SchedulingReadServiceInterface::class, SchedulingReadService::class); // público
$this->app->register(EventServiceProvider::class);
$this->app->register(RouteServiceProvider::class);
```

Policies (boot): `Gate::policy(Appointment::class, AppointmentPolicy::class)`.
