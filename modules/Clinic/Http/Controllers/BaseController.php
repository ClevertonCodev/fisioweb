<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Clinic\Models\Clinic;

class BaseController extends Controller
{
    /** @var \Modules\Clinic\Models\ClinicUser|null */
    protected $user;

    /** @var \Modules\Clinic\Models\Clinic|null */
    protected $clinic;

    public function __construct()
    {
        $this->user = auth('clinic')->user();

        if (empty($this->user) || empty($this->user->clinic_id)) {
            return redirect()->route('clinic.login');
        }

        $this->clinic = Clinic::find($this->user->clinic_id);

        if (empty($this->clinic)) {
            return redirect()->route('clinic.login');
        }
    }
}
