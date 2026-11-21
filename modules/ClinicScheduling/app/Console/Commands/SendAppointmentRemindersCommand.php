<?php

namespace Modules\ClinicScheduling\Console\Commands;

use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Modules\ClinicScheduling\Contracts\AppointmentReminderServiceInterface;

class SendAppointmentRemindersCommand extends Command
{
    protected $signature = 'clinic-scheduling:send-appointment-reminders';

    protected $description = 'Dispara o lembrete das consultas que começam entre 23 e 24 horas depois da hora cheia da rodada.';

    public function handle(AppointmentReminderServiceInterface $reminders): int
    {
        $dispatched = $reminders->dispatchDue(CarbonImmutable::now());

        $this->info("{$dispatched} lembrete(s) disparado(s).");

        return self::SUCCESS;
    }
}
