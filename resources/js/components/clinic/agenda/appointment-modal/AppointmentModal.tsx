import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarX } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import type { AppointmentWriteDto } from '@/application/clinic';
import {
    flattenHistoryPages,
    usePatientAppointmentHistory,
} from '@/application/clinic';
import { DsButton, DsModal, DsTabs, dsCn } from '@/components/ds';
import type {
    Appointment,
    AppointmentStatus,
    PatientAppointmentHistoryItem,
    ServiceType,
    ServiceTypeDraft,
} from '@/domain/clinic';
import { selectableAppointmentStatuses } from '@/domain/clinic';
import { htmlToPlainText } from '@/lib/html-to-plain-text';

import {
    DS_STATUS,
    formatDuration,
    formatHistoryDate,
    formatLongDate,
    formatTime,
    formatTimeRange,
    statusLabel,
} from '../agenda-shared';

import {
    appointmentFormSchema,
    initialFormValues,
    parsePlace,
    placeLabel,
    toWriteDto,
    type AppointmentFormValues,
} from './appointment-form';
import { AppointmentFormFields } from './AppointmentFormFields';
import { StatusPills } from './AppointmentFormParts';
import { ServiceTypeEditor } from './ServiceTypeEditor';

export interface AppointmentModalProps {
    /** Usuário logado: separa o cache do histórico por sessão. */
    userId: string | undefined;
    open: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    initialDate: Date | null;
    initialPatientId?: string;
    patients: { id: string; name: string }[];
    clinicUsers: { id: string; name: string }[];
    onSubmit: (dto: AppointmentWriteDto) => Promise<void> | void;
    isSubmitting?: boolean;
    lockedClinicUserId?: string;
    onStatusChange?: (status: AppointmentStatus) => Promise<void> | void;
    onCancelAppointment?: () => Promise<void> | void;
    isMutatingStatus?: boolean;
    serviceTypes: ServiceType[];
    /** Presente só para quem edita os tipos (admin e secretária). */
    onSaveServiceTypes?: (items: ServiceTypeDraft[]) => Promise<void>;
    isSavingServiceTypes?: boolean;
}

function Tile({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="rounded-ds-md border border-ds-border-subtle px-3 py-2.5">
            <p className="text-ds-caption text-ds-content-muted">{label}</p>
            <p className="truncate text-ds-body-sm font-medium">{children}</p>
        </div>
    );
}

/**
 * Modal de consulta da agenda v2. Nova consulta: só o formulário. Consulta
 * existente: cabeçalho na cor do status e as abas Resumo (blocos + status),
 * Editar (formulário) e Histórico (todas as consultas do paciente).
 *
 * A AgendaPage remonta o modal a cada abertura (`key`), então o formulário
 * sempre começa da consulta ou do horário escolhido.
 */
export function AppointmentModal(props: AppointmentModalProps) {
    const navigate = useNavigate();
    const apt = props.appointment;
    const isFromGoogle = apt?.source === 'google';
    const isCancelled = apt?.status === 'cancelled';
    const [tab, setTab] = useState(apt ? 'resumo' : 'editar');
    const [editingTypes, setEditingTypes] = useState(false);

    const originalRoom = apt ? parsePlace(apt.location).room : undefined;
    const schema = useMemo(
        () => appointmentFormSchema(!isFromGoogle, originalRoom),
        [isFromGoogle, originalRoom],
    );
    const form = useForm<AppointmentFormValues>({
        resolver: zodResolver(schema),
        defaultValues: initialFormValues({
            appointment: apt,
            initialDate: props.initialDate,
            initialPatientId: props.initialPatientId,
            lockedClinicUserId: props.lockedClinicUserId,
        }),
    });

    const historyQuery = usePatientAppointmentHistory(
        props.open && apt && !isFromGoogle ? apt.patientId : null,
        props.userId,
    );
    const historyPages = historyQuery.data?.pages ?? [];
    // Página `null` = a API respondeu 404: o usuário não pode ver o histórico.
    const historyUnavailable = historyPages[0] === null;
    const history = flattenHistoryPages(historyPages);
    const historyTotal = historyPages[0]?.total ?? 0;
    // Lista da mais recente para a mais antiga: a posição conta do fim.
    const historyIndex = apt ? history.findIndex((a) => a.id === apt.id) : -1;
    const historyOrdinal = historyIndex >= 0 ? historyTotal - historyIndex : 0;

    const submit = form.handleSubmit(
        (values) =>
            props.onSubmit(
                toWriteDto(
                    values,
                    {
                        isFromGoogle,
                        original: apt ? apt.location : undefined,
                        placeTouched:
                            !!form.formState.dirtyFields.place ||
                            !!form.formState.dirtyFields.room,
                    },
                    apt
                        ? {
                              startsAt: apt.startsAt,
                              endsAt: apt.endsAt,
                              touched:
                                  !!form.formState.dirtyFields.date ||
                                  !!form.formState.dirtyFields.start ||
                                  !!form.formState.dirtyFields.end ||
                                  !!form.formState.dirtyFields.durationMinutes,
                          }
                        : undefined,
                ),
            ),
        // Nunca barrar em silêncio: os erros aparecem nos campos, e o aviso
        // cobre o caso de algum ficar fora da vista.
        () => toast.error('Revise os campos destacados antes de salvar.'),
    );

    const close = () => props.onClose();

    const fields =
        editingTypes && props.onSaveServiceTypes ? (
            <ServiceTypeEditor
                serviceTypes={props.serviceTypes}
                isSaving={!!props.isSavingServiceTypes}
                onCancel={() => setEditingTypes(false)}
                onSave={async (items) => {
                    try {
                        await props.onSaveServiceTypes?.(items);
                        setEditingTypes(false);
                    } catch {
                        // O erro já foi mostrado; o editor continua aberto.
                    }
                }}
            />
        ) : (
            <AppointmentFormFields
                form={form}
                patients={props.patients}
                clinicUsers={props.clinicUsers}
                lockedClinicUserId={props.lockedClinicUserId}
                isFromGoogle={isFromGoogle}
                serviceTypes={props.serviceTypes}
                onEditServiceTypes={
                    props.onSaveServiceTypes
                        ? () => setEditingTypes(true)
                        : undefined
                }
            />
        );

    const footerSave = editingTypes ? undefined : (
        <div className="flex w-full justify-end gap-2">
            <DsButton variant="secondary" label="Fechar" onClick={close} />
            <DsButton
                label={apt ? 'Salvar alterações' : 'Agendar'}
                loading={props.isSubmitting}
                disabled={isCancelled}
                onClick={() => submit()}
            />
        </div>
    );

    if (!apt) {
        return (
            <DsModal
                open={props.open}
                onOpenChange={(v) => !v && close()}
                size="md"
                title={editingTypes ? 'Tipos de serviço' : 'Nova consulta'}
                footer={footerSave}
            >
                {fields}
            </DsModal>
        );
    }

    const tone = DS_STATUS[apt.status];
    const name = (isFromGoogle ? apt.title : apt.patientName) || 'Evento';
    const minutes = Math.round(
        (new Date(apt.endsAt).getTime() - new Date(apt.startsAt).getTime()) /
            60000,
    );
    const description = htmlToPlainText(apt.description);
    const statusOptions = selectableAppointmentStatuses(
        apt.status,
        apt.startsAt,
    );
    const canCancel =
        !!props.onCancelAppointment && !isCancelled && !isFromGoogle;

    const tabs = [
        { key: 'resumo', label: 'Resumo' },
        ...(!isCancelled ? [{ key: 'editar', label: 'Editar' }] : []),
        ...(!isFromGoogle
            ? [
                  {
                      key: 'historico',
                      label:
                          historyTotal > 0
                              ? `Histórico (${historyTotal})`
                              : 'Histórico',
                  },
              ]
            : []),
    ];
    const activeTab = tabs.some((t) => t.key === tab) ? tab : 'resumo';

    return (
        <DsModal
            open={props.open}
            onOpenChange={(v) => !v && close()}
            size="md"
            title={
                editingTypes
                    ? 'Tipos de serviço'
                    : isFromGoogle
                      ? 'Evento do Google'
                      : 'Consulta'
            }
            footer={
                activeTab === 'editar' ? (
                    footerSave
                ) : (
                    <div className="flex w-full flex-wrap items-center justify-between gap-2">
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
                                onClick={close}
                            />
                            {!isFromGoogle && (
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
                                isCancelled && 'line-through',
                            )}
                        >
                            {name}
                        </p>
                        <p className="text-ds-body-sm opacity-90">
                            {formatLongDate(new Date(apt.startsAt))} ·{' '}
                            <span className="tabular-nums">
                                {formatTimeRange(apt.startsAt, apt.endsAt)}
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
                    value={activeTab}
                    onValueChange={(key) => {
                        setEditingTypes(false);
                        setTab(key);
                    }}
                />

                {activeTab === 'resumo' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Tile label="Tipo de serviço">
                                {apt.title || 'Consulta'}
                            </Tile>
                            <Tile label="Local">
                                {isFromGoogle
                                    ? apt.location || '—'
                                    : placeLabel(apt.location)}
                            </Tile>
                            <Tile label="Fisioterapeuta">
                                {apt.clinicUserName || '—'}
                            </Tile>
                            <Tile label="Duração">
                                {minutes > 0 ? formatDuration(minutes) : '—'}
                                {historyOrdinal > 0 && (
                                    <span className="font-normal text-ds-content-muted">
                                        {' '}
                                        · {historyOrdinal}ª de {historyTotal}
                                    </span>
                                )}
                            </Tile>
                        </div>
                        {description && (
                            <div className="rounded-ds-md bg-ds-surface-subtle px-3 py-2.5 text-ds-body-sm whitespace-pre-line text-ds-content-secondary">
                                {description}
                            </div>
                        )}
                        {!isFromGoogle && props.onStatusChange && (
                            <div className="space-y-2">
                                <p className="text-ds-caption font-semibold tracking-wider text-ds-content-muted uppercase">
                                    Situação
                                </p>
                                <StatusPills
                                    current={apt.status}
                                    options={statusOptions}
                                    onChange={(s) => props.onStatusChange?.(s)}
                                    disabled={
                                        props.isMutatingStatus || isCancelled
                                    }
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'editar' && fields}

                {activeTab === 'historico' && (
                    <HistoryList
                        currentId={apt.id}
                        items={history}
                        total={historyTotal}
                        loading={historyQuery.isLoading}
                        failed={historyQuery.isError}
                        unavailable={historyUnavailable}
                        hasMore={!!historyQuery.hasNextPage}
                        loadingMore={historyQuery.isFetchingNextPage}
                        onLoadMore={() => historyQuery.fetchNextPage()}
                    />
                )}
            </div>
        </DsModal>
    );
}

function HistoryList({
    currentId,
    items,
    total,
    loading,
    failed,
    unavailable,
    hasMore,
    loadingMore,
    onLoadMore,
}: {
    currentId: string;
    /** Da consulta mais recente para a mais antiga. */
    items: PatientAppointmentHistoryItem[];
    total: number;
    loading: boolean;
    failed: boolean;
    unavailable: boolean;
    hasMore: boolean;
    loadingMore: boolean;
    onLoadMore: () => void;
}) {
    if (loading) {
        return (
            <p className="text-ds-body-sm text-ds-content-muted">
                Carregando histórico…
            </p>
        );
    }
    if (unavailable) {
        return (
            <p className="rounded-ds-md bg-ds-surface-subtle px-3 py-2.5 text-ds-body-sm text-ds-content-secondary">
                O histórico deste paciente aparece para quem tem consulta ativa
                com ele.
            </p>
        );
    }
    if (failed) {
        return (
            <p className="text-ds-body-sm text-ds-content-danger">
                Não foi possível carregar o histórico.
            </p>
        );
    }
    return (
        <div className="space-y-3">
            <ul className="max-h-[360px] divide-y divide-ds-border-subtle overflow-y-auto rounded-ds-md border border-ds-border-subtle">
                {items.map((a, i) => {
                    const t = DS_STATUS[a.status];
                    const current = a.id === currentId;
                    return (
                        <li
                            key={a.id}
                            aria-current={current ? 'true' : undefined}
                            className={dsCn(
                                'flex items-center gap-3 px-3 py-2.5',
                                current && 'bg-ds-surface-brand-subtle',
                            )}
                        >
                            <span className="w-6 text-right text-ds-caption text-ds-content-muted tabular-nums">
                                {total - i}
                            </span>
                            <span
                                className="size-2.5 shrink-0 rounded-ds-full"
                                style={{ background: t.accent }}
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-ds-body-xs font-medium">
                                    {formatHistoryDate(new Date(a.startsAt))} ·{' '}
                                    {formatTime(a.startsAt)}
                                </span>
                                <span className="block truncate text-ds-caption text-ds-content-muted">
                                    {a.title || 'Consulta'} · {a.clinicUserName}
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
            {hasMore && (
                <DsButton
                    variant="tertiary"
                    size="sm"
                    label="Carregar consultas mais antigas"
                    loading={loadingMore}
                    onClick={onLoadMore}
                />
            )}
        </div>
    );
}
