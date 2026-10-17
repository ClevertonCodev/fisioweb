import { DsTooltip, dsCn } from '@/components/ds';
import type { Patient } from '@/domain/clinic/patient';

import {
    INACTIVATE_ICON,
    PATIENT_LINKS,
    type PatientListState,
} from './shared';

/**
 * Faixa fina no rodapé do cartão, só ícones, um por coluna. Escolhida entre
 * quatro estilos; descartados: ícone + nome miúdo, botões pequenos e barra
 * só no hover.
 */
export function CardActions({
    patient,
    state,
}: {
    patient: Patient;
    state: PatientListState;
}) {
    const actions = [
        ...PATIENT_LINKS.filter((l) => l.key !== 'prontuario').map((l) => ({
            key: l.key,
            label: l.label,
            icon: l.icon,
            danger: false,
            run: () => state.navigate(l.path(patient)),
        })),
        {
            key: 'inativar',
            label: 'Inativar paciente',
            icon: INACTIVATE_ICON,
            danger: true,
            run: () => state.inactivate([patient]),
        },
    ];

    return (
        // Clique nas ações não abre o prontuário (o cartão inteiro é clicável).
        <div
            className="-mx-5 mt-4 -mb-5 grid grid-cols-4 divide-x divide-ds-border-subtle border-t border-ds-border-subtle"
            onClick={(e) => e.stopPropagation()}
        >
            {actions.map((a) => (
                <DsTooltip key={a.key} content={a.label} asChild>
                    <button
                        type="button"
                        aria-label={a.label}
                        onClick={a.run}
                        className={dsCn(
                            'flex h-10 cursor-pointer items-center justify-center transition-colors [&_svg]:size-4',
                            a.danger
                                ? 'text-ds-content-danger hover:bg-ds-status-danger-surface'
                                : 'text-ds-content-secondary hover:bg-ds-surface-brand-subtle hover:text-ds-content-brand ds-dark:hover:text-ds-primary-60',
                        )}
                    >
                        {a.icon}
                    </button>
                </DsTooltip>
            ))}
        </div>
    );
}
