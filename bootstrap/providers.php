<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\FortifyServiceProvider::class,
    Modules\Admin\Providers\AdminServiceProvider::class,
    Modules\Clinic\Providers\ClinicServiceProvider::class,
    Modules\Cloudflare\Providers\CloudflareServiceProvider::class,
    Modules\Media\Providers\MediaServiceProvider::class,
    Modules\Patient\Providers\PatientServiceProvider::class,
];
