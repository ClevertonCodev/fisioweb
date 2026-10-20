<?php

namespace Modules\Clinic\Enums;

use Illuminate\Validation\Rule;

/**
 * Chaves de preferência aceitas para o usuário da clínica. Cada chave valida o
 * próprio valor; para outra tela guardar uma preferência, registre a chave aqui.
 */
enum ClinicUserPreferenceKey: string
{
    case AgendaView         = 'agenda.view';
    case AgendaShowWeekends = 'agenda.show_weekends';

    /**
     * @return array<int, mixed>
     */
    public function valueRules(): array
    {
        return match ($this) {
            self::AgendaView => ['required', 'string', Rule::in([
                'listWeek',
                'timeGridDay',
                'timeGridThreeDay',
                'timeGridWeek',
                'dayGridMonth',
            ])],
            self::AgendaShowWeekends => ['present', 'boolean:strict'],
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
