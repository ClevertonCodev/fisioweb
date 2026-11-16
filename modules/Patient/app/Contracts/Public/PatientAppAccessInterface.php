<?php

namespace Modules\Patient\Contracts\Public;

interface PatientAppAccessInterface
{
    /**
     * Se o paciente pode usar o app agora, pela mesma regra do login. O paciente
     * excluído ou que não existe não pode.
     */
    public function allowsAppAccess(int $patientId): bool;
}
