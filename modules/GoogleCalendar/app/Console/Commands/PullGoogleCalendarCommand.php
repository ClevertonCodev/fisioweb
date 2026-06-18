<?php

namespace Modules\GoogleCalendar\Console\Commands;

use Illuminate\Console\Command;
use Modules\Clinic\Models\ClinicUser;
use Modules\GoogleCalendar\Jobs\PullGoogleCalendarJob;

class PullGoogleCalendarCommand extends Command
{
    protected $signature = 'google-calendar:pull';

    protected $description = 'Despacha o pull incremental do Google Calendar para cada usuário conectado.';

    public function handle(): int
    {
        $count = 0;

        ClinicUser::whereNotNull('google_connected_at')
            ->select('id')
            ->chunkById(100, function ($users) use (&$count) {
                foreach ($users as $user) {
                    PullGoogleCalendarJob::dispatch($user->id);
                    $count++;
                }
            });

        $this->info("Pull despachado para {$count} usuário(s) conectado(s).");

        return self::SUCCESS;
    }
}
