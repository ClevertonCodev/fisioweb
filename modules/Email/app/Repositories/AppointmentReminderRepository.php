<?php

namespace Modules\Email\Repositories;

use Carbon\CarbonImmutable;
use Modules\Email\Contracts\AppointmentReminderRepositoryInterface;
use Modules\Email\Models\AppointmentReminder;

class AppointmentReminderRepository implements AppointmentReminderRepositoryInterface
{
    public function __construct(
        protected AppointmentReminder $model,
    ) {}

    public function reserve(int $clinicId, int $appointmentId, CarbonImmutable $startsAt): bool
    {
        $inserted = $this->model->newQuery()->insertOrIgnore([
            'clinic_id'      => $clinicId,
            'appointment_id' => $appointmentId,
            'starts_at'      => $this->databaseTime($startsAt),
            'sent_at'        => $this->databaseTime(CarbonImmutable::now()),
        ]);

        return $inserted === 1;
    }

    public function release(int $appointmentId, CarbonImmutable $startsAt): void
    {
        $this->model->newQuery()
            ->where('appointment_id', $appointmentId)
            ->where('starts_at', $this->databaseTime($startsAt))
            ->delete();
    }

    private function databaseTime(CarbonImmutable $moment): string
    {
        return $moment->setTimezone((string) config('app.timezone'))->format('Y-m-d H:i:s');
    }
}
