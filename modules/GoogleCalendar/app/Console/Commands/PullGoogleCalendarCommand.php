<?php

namespace Modules\GoogleCalendar\Console\Commands;

use Illuminate\Console\Command;
use Modules\Clinic\Contracts\Public\ClinicUserGoogleConnectionReadServiceInterface;
use Modules\GoogleCalendar\Jobs\PullGoogleCalendarJob;

class PullGoogleCalendarCommand extends Command
{
    protected $signature = 'google-calendar:pull';

    protected $description = 'Despacha o pull incremental do Google Calendar para cada usuário conectado.';

    public function handle(ClinicUserGoogleConnectionReadServiceInterface $connections): int
    {
        $count = 0;

        foreach ($connections->connectedClinicUserIds() as $clinicUserId) {
            PullGoogleCalendarJob::dispatch($clinicUserId);
            $count++;
        }

        $this->info("Pull despachado para {$count} usuário(s) conectado(s).");

        return self::SUCCESS;
    }
}
