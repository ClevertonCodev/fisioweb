import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { DsBadge, DsCard, DsTooltip, dsCn } from '@/components/ds';
import type { Patient } from '@/domain/clinic/patient';

import { PATIENT_SHORTCUTS, patientRecordPath } from './patient-links';
import { PatientStatusBadge } from './patient-status';
import { PatientAvatar } from './PatientAvatar';

const shortcutClass =
    'flex h-10 cursor-pointer items-center justify-center text-ds-content-secondary transition-colors hover:bg-ds-surface-brand-subtle hover:text-ds-content-brand focus-visible:shadow-ds-focus focus-visible:outline-0 ds-dark:hover:text-ds-primary-60 [&_svg]:size-4';

/**
 * Um paciente da lista. O nome é o link do prontuário e cobre o cartão
 * inteiro (link esticado); os atalhos do rodapé ficam por cima dele.
 * `action` é a quarta casa do rodapé (inativar ou reativar).
 */
export function PatientCard({
    patient,
    action,
}: {
    patient: Patient;
    action?: ReactNode;
}) {
    return (
        <DsCard
            variant="interactive"
            data-inactive={!patient.isActive || undefined}
            className="h-full"
        >
            {/* Inativo: esmaece nome e diagnóstico; os selos ficam legíveis. */}
            <div className="flex flex-1 flex-col">
                <div
                    className={dsCn(
                        'flex items-start gap-3',
                        !patient.isActive && 'opacity-60',
                    )}
                >
                    <PatientAvatar patient={patient} />
                    <div className="min-w-0 flex-1">
                        <Link
                            to={patientRecordPath(patient)}
                            className="block truncate text-ds-body-emphasis text-ds-content-primary outline-0 after:absolute after:inset-0 after:rounded-ds-lg after:content-[''] focus-visible:after:shadow-ds-focus"
                        >
                            {patient.name}
                        </Link>
                        <p className="truncate text-ds-caption text-ds-content-secondary">
                            por {patient.professional || '—'}
                        </p>
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <PatientStatusBadge status={patient.status} />
                    {!patient.isActive && <DsBadge>Inativo</DsBadge>}
                </div>
                <p
                    className={dsCn(
                        'mt-3 line-clamp-3 min-h-[3lh] flex-1 text-ds-body-sm text-ds-content-secondary',
                        !patient.isActive && 'opacity-60',
                    )}
                >
                    {patient.diagnosis || (
                        <span className="text-ds-content-muted">
                            Sem diagnóstico registrado.
                        </span>
                    )}
                </p>
            </div>
            <div
                className={dsCn(
                    'relative z-10 -mx-5 mt-0 -mb-5 grid divide-x divide-ds-border-subtle border-t border-ds-border-subtle',
                    action ? 'grid-cols-4' : 'grid-cols-3',
                )}
            >
                {PATIENT_SHORTCUTS.map((s) => (
                    <DsTooltip key={s.key} content={s.label} asChild>
                        <Link
                            to={s.path(patient)}
                            aria-label={s.label}
                            className={shortcutClass}
                        >
                            {s.icon}
                        </Link>
                    </DsTooltip>
                ))}
                {action}
            </div>
        </DsCard>
    );
}
