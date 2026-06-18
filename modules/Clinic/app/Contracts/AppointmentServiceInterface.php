<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\Clinic\Enums\AppointmentStatus;
use Modules\Clinic\Models\Appointment;
use Modules\Clinic\Models\ClinicUser;

interface AppointmentServiceInterface
{
    /** Cria consulta (status inicial Agendada) e dispara pós-agendamento. */
    public function create(array $data): Appointment;

    /** Edita dados da consulta (não altera status). */
    public function update(int $id, array $data): Appointment;

    /** Altera o status respeitando a máquina de transições (FR-023). */
    public function updateStatus(int $id, AppointmentStatus $status): Appointment;

    /** Cancela a consulta (status Cancelada; sem hard delete). */
    public function cancel(int $id): Appointment;

    /** Lista consultas visíveis para o usuário conforme o papel (FR-009). */
    public function listForUser(ClinicUser $user, array $filters = []): Collection;
}
