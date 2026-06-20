<?php

namespace Modules\Clinic\Enums;

/** Tipos de evento do log de atividades da clínica (FR-022b). */
enum ActivityType: string
{
    case PatientCreated       = 'patient_created';
    case PatientUpdated       = 'patient_updated';
    case ProgramCreated       = 'program_created';
    case ProgramCompleted     = 'program_completed';
    case AppointmentScheduled = 'appointment_scheduled';
    case AppointmentCompleted = 'appointment_completed';
    case AppointmentCancelled = 'appointment_cancelled';
    case ExercisesAdded       = 'exercises_added';

    /** Rótulo curto em pt-BR (cabeçalho da atividade no feed). */
    public function label(): string
    {
        return match ($this) {
            self::PatientCreated       => 'Novo paciente',
            self::PatientUpdated       => 'Paciente atualizado',
            self::ProgramCreated       => 'Programa criado',
            self::ProgramCompleted     => 'Programa concluído',
            self::AppointmentScheduled => 'Consulta agendada',
            self::AppointmentCompleted => 'Consulta concluída',
            self::AppointmentCancelled => 'Consulta cancelada',
            self::ExercisesAdded       => 'Exercícios adicionados',
        };
    }
}
