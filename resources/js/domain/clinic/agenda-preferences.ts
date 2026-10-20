/** Visões do calendário da agenda (espelha a chave `agenda.view` do backend). */
export const AGENDA_VIEWS = [
    'listWeek',
    'timeGridDay',
    'timeGridThreeDay',
    'timeGridWeek',
    'dayGridMonth',
] as const;

export type AgendaView = (typeof AGENDA_VIEWS)[number];

/** Preferências da agenda salvas na conta do usuário da clínica. */
export interface AgendaPreferences {
    view: AgendaView;
    showWeekends: boolean;
}

export const DEFAULT_AGENDA_PREFERENCES: AgendaPreferences = {
    view: 'timeGridWeek',
    showWeekends: true,
};

export function isAgendaView(value: unknown): value is AgendaView {
    return (
        typeof value === 'string' &&
        (AGENDA_VIEWS as readonly string[]).includes(value)
    );
}
