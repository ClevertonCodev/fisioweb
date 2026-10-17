import { CalendarX } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { DsButton, DsModal, DsTabs, dsCn } from '@/components/ds';

import { DS_STATUS, formatTime, statusLabel } from '../shared';

import { AppointmentFormFields } from './AppointmentForm';
import {
    StatusPills,
    formatLongDate,
    minutesBetween,
    patientHistory,
    placeLabel,
    useAppointmentDraft,
    type ModalPrototypeProps,
} from './modal-shared';

function Tile({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="rounded-ds-md border border-ds-border-subtle px-3 py-2.5">
            <p className="text-ds-caption text-ds-content-muted">{label}</p>
            <p className="truncate text-ds-body-sm font-medium">{children}</p>
        </div>
    );
}

/**
 * F — cabeçalho cheio na cor do status (paciente, situação, quando) e abas:
 * Resumo (blocos + status), Editar (formulário) e Histórico (as consultas
 * do paciente, com esta destacada).
 */
export function ModalF(props: ModalPrototypeProps) {
    const navigate = useNavigate();
    const d = useAppointmentDraft(props);
    const { draft } = d;
    const apt = props.appointment;
    const [tab, setTab] = useState(apt ? 'resumo' : 'editar');

    const footerSave = (
        <div className="flex w-full justify-end gap-2">
            <DsButton
                variant="secondary"
                label="Fechar"
                onClick={props.onClose}
            />
            <DsButton
                label={apt ? 'Salvar alterações' : 'Agendar'}
                loading={props.isSubmitting}
                disabled={d.isCancelled}
                onClick={() => d.submit()}
            />
        </div>
    );

    if (!apt) {
        return (
            <DsModal
                open={props.open}
                onOpenChange={(v) => !v && props.onClose()}
                size="md"
                title="Nova consulta"
                footer={footerSave}
            >
                <AppointmentFormFields d={d} props={props} />
            </DsModal>
        );
    }

    const tone = DS_STATUS[apt.status];
    const name = d.patientName || apt.title || 'Evento';
    const minutes = minutesBetween(draft.start, draft.end);
    const { list, index } = patientHistory(apt, props.allAppointments);
    const canCancel =
        !!props.onCancelAppointment && !d.isCancelled && !d.isFromGoogle;

    const tabs = [
        { key: 'resumo', label: 'Resumo' },
        ...(!d.isCancelled ? [{ key: 'editar', label: 'Editar' }] : []),
        ...(list.length > 0
            ? [{ key: 'historico', label: `Histórico (${list.length})` }]
            : []),
    ];

    return (
        <DsModal
            open={props.open}
            onOpenChange={(v) => !v && props.onClose()}
            size="md"
            title="Consulta"
            footer={
                tab === 'editar' ? (
                    footerSave
                ) : (
                    <div className="flex w-full items-center justify-between gap-2">
                        {canCancel ? (
                            <DsButton
                                variant="destructive-tertiary"
                                iconPosition="left"
                                icon={<CalendarX />}
                                label="Cancelar consulta"
                                disabled={props.isMutatingStatus}
                                onClick={() => props.onCancelAppointment?.()}
                            />
                        ) : (
                            <span />
                        )}
                        <div className="flex gap-2">
                            <DsButton
                                variant="secondary"
                                label="Fechar"
                                onClick={props.onClose}
                            />
                            {!d.isFromGoogle && (
                                <DsButton
                                    label="Abrir prontuário"
                                    onClick={() =>
                                        navigate(
                                            `/clinica/pacientes/${apt.patientId}`,
                                        )
                                    }
                                />
                            )}
                        </div>
                    </div>
                )
            }
        >
            <div className="space-y-4 font-ds">
                {/* Cabeçalho cheio na cor do status */}
                <div
                    className="flex items-center gap-4 rounded-ds-lg px-5 py-4"
                    style={{ background: tone.surface, color: tone.content }}
                >
                    <span
                        className="flex size-14 shrink-0 items-center justify-center rounded-ds-full text-ds-h3 font-semibold text-ds-white"
                        style={{ background: tone.accent }}
                    >
                        {name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p
                            className={dsCn(
                                'truncate text-ds-h4 font-semibold',
                                d.isCancelled && 'line-through',
                            )}
                        >
                            {name}
                        </p>
                        <p className="text-ds-body-sm opacity-90">
                            {formatLongDate(draft.date)} ·{' '}
                            <span className="tabular-nums">
                                {draft.start} – {draft.end}
                            </span>
                        </p>
                    </div>
                    <span
                        className="shrink-0 rounded-ds-pill bg-ds-surface-default px-3 py-1 text-ds-caption font-semibold"
                        style={{ color: tone.content }}
                    >
                        {statusLabel(apt.status)}
                    </span>
                </div>

                <DsTabs
                    size="sm"
                    tabs={tabs}
                    value={tab}
                    onValueChange={setTab}
                />

                {tab === 'resumo' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Tile label="Tipo de serviço">
                                {draft.title || 'Consulta'}
                            </Tile>
                            <Tile label="Local">
                                {d.isFromGoogle
                                    ? '—'
                                    : placeLabel(draft.location)}
                            </Tile>
                            <Tile label="Fisioterapeuta">
                                {d.professionalName || '—'}
                            </Tile>
                            <Tile label="Duração">
                                {minutes ? `${minutes} min` : '—'}
                                {list.length > 0 && (
                                    <span className="font-normal text-ds-content-muted">
                                        {' '}
                                        · {index + 1}ª de {list.length}
                                    </span>
                                )}
                            </Tile>
                        </div>
                        {draft.description && (
                            <div className="rounded-ds-md bg-ds-surface-subtle px-3 py-2.5 text-ds-body-sm whitespace-pre-line text-ds-content-secondary">
                                {draft.description}
                            </div>
                        )}
                        {!d.isFromGoogle && props.onStatusChange && (
                            <div className="space-y-2">
                                <p className="text-ds-caption font-semibold tracking-wider text-ds-content-muted uppercase">
                                    Situação
                                </p>
                                <StatusPills
                                    current={apt.status}
                                    options={d.statusOptions}
                                    onChange={(s) => props.onStatusChange?.(s)}
                                    disabled={
                                        props.isMutatingStatus || d.isCancelled
                                    }
                                />
                            </div>
                        )}
                    </div>
                )}

                {tab === 'editar' && (
                    <AppointmentFormFields d={d} props={props} />
                )}

                {tab === 'historico' && (
                    <ul className="max-h-[360px] divide-y divide-ds-border-subtle overflow-y-auto rounded-ds-md border border-ds-border-subtle">
                        {list.map((a, i) => {
                            const t = DS_STATUS[a.status];
                            const current = a.id === apt.id;
                            return (
                                <li
                                    key={a.id}
                                    className={dsCn(
                                        'flex items-center gap-3 px-3 py-2.5',
                                        current && 'bg-ds-surface-brand-subtle',
                                    )}
                                >
                                    <span className="w-6 text-right text-ds-caption text-ds-content-muted tabular-nums">
                                        {i + 1}
                                    </span>
                                    <span
                                        className="size-2.5 shrink-0 rounded-ds-full"
                                        style={{ background: t.accent }}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-ds-body-xs font-medium">
                                            {formatLongDate(
                                                new Date(a.startsAt),
                                            )}{' '}
                                            · {formatTime(a.startsAt)}
                                        </span>
                                        <span className="block truncate text-ds-caption text-ds-content-muted">
                                            {a.title || 'Consulta'} ·{' '}
                                            {a.clinicUserName}
                                        </span>
                                    </span>
                                    <span
                                        className="text-ds-caption font-medium"
                                        style={{ color: t.content }}
                                    >
                                        {statusLabel(a.status)}
                                    </span>
                                    {current && (
                                        <span className="text-ds-caption font-semibold text-ds-content-brand">
                                            esta
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </DsModal>
    );
}
