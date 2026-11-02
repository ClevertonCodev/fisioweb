<?php

namespace Modules\Clinic\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Modules\Clinic\Contracts\ClinicRegistrationServiceInterface;

class SendClinicEmailVerificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 30, 60];

    public function __construct(
        public int $clinicUserId,
    ) {}

    public function handle(ClinicRegistrationServiceInterface $registrationService): void
    {
        $registrationService->sendVerificationNotification($this->clinicUserId);

        logInfo('e-mail de confirmação da clínica processado', [
            'clinic_user_id' => $this->clinicUserId,
        ]);
    }

    public function failed(\Throwable $e): void
    {
        logError('falha ao enviar e-mail de confirmação da clínica', [
            'clinic_user_id' => $this->clinicUserId,
            'error'          => $e->getMessage(),
        ]);
    }
}
