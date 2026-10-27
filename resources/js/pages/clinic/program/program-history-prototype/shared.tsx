/**
 * PROTÓTIPO (descartável): peças comuns às variantes da aba Histórico v2.
 * Ações que alteram dados (duplicar, transformar em modelo, excluir) são stub.
 */
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    BookmarkCheck,
    CalendarClock,
    CircleDot,
    Copy,
    FileDown,
    FileText,
    Link2,
    MoreHorizontal,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { downloadProgramPdf } from '@/application/clinic/download-program-pdf';
import { formatProgramClinicalRecordText } from '@/application/clinic/format-program-clinical-record-text';
import { findClinicProgram } from '@/application/clinic/use-programs';
import {
    DsBadge,
    DsButton,
    DsCheckbox,
    DsDatepicker,
    DsDropdown,
    DsModal,
    DsRadio,
    DsRadioGroup,
    DsTooltip,
    dsCn,
    type BadgeVariant,
    type DateRange,
    type FilterChip,
} from '@/components/ds';
import type { Program } from '@/domain/clinic';

// ---------------------------------------------------------------- datas

const DAY = 86_400_000;

/** 'AAAA-MM-DD' ou ISO completo → Date local (meia-noite para só data). */
export function parseDate(value: string | null): Date | null {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number) as [
            number,
            number,
            number,
        ];
        return new Date(y, m - 1, d);
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatShort(value: string | null): string {
    const date = parseDate(value);
    if (!date) return '—';
    return date
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        .replace('.', '');
}

export function formatLong(value: string | null): string {
    const date = parseDate(value);
    if (!date) return '—';
    return date
        .toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        .replace('.', '');
}

function isoToDate(iso: string | null): Date | null {
    return parseDate(iso);
}

function dateToIso(date: Date | null): string | null {
    if (!date) return null;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ---------------------------------------------------------------- status

export type UiStatus = 'not_viewed' | 'viewed' | 'completed' | 'draft';

export function uiStatusOf(program: Program): UiStatus {
    if (program.status === 'draft') return 'draft';
    if (program.status === 'completed') return 'completed';
    if (program.patientViewedAt) return 'viewed';
    return 'not_viewed';
}

export const STATUS_OPTIONS: {
    value: UiStatus;
    label: string;
    variant: BadgeVariant;
}[] = [
    { value: 'not_viewed', label: 'Não visualizado', variant: 'warning' },
    { value: 'viewed', label: 'Visualizado', variant: 'info' },
    { value: 'completed', label: 'Completou', variant: 'success' },
    { value: 'draft', label: 'Rascunho', variant: 'default' },
];

export function ProgramStatusBadge({ program }: { program: Program }) {
    const ui = uiStatusOf(program);
    const option = STATUS_OPTIONS.find((o) => o.value === ui);
    const times =
        ui === 'completed' && program.patientCompletedCount > 0
            ? ` · ${program.patientCompletedCount}x`
            : '';
    return (
        <DsBadge variant={option?.variant ?? 'default'} dot>
            {option?.label}
            {times}
        </DsBadge>
    );
}

// ---------------------------------------------------------------- validade

export type ValidityKey = 'active' | 'ending' | 'ended' | 'open';

export const VALIDITY_LABELS: Record<ValidityKey, string> = {
    active: 'Vigente',
    ending: 'Termina em até 7 dias',
    ended: 'Encerrado',
    open: 'Sem data de término',
};

export interface Validity {
    key: ValidityKey;
    /** Duração total em dias (início → término). */
    totalDays: number | null;
    /** Dias que faltam (negativo: já terminou). */
    daysLeft: number | null;
    /** Quanto do período já passou, 0–100. */
    progress: number;
    text: string;
}

export function validityOf(program: Program): Validity {
    const start = parseDate(program.startDate);
    const end = parseDate(program.endDate);
    const today = startOfToday();
    if (!end) {
        return {
            key: 'open',
            totalDays: null,
            daysLeft: null,
            progress: 0,
            text: 'Sem data de término',
        };
    }
    const daysLeft = Math.round((end.getTime() - today.getTime()) / DAY);
    const totalDays = start
        ? Math.max(0, Math.round((end.getTime() - start.getTime()) / DAY))
        : null;
    const elapsed = start ? (today.getTime() - start.getTime()) / DAY : 0;
    const progress =
        totalDays && totalDays > 0
            ? Math.min(
                  100,
                  Math.max(0, Math.round((elapsed / totalDays) * 100)),
              )
            : daysLeft < 0
              ? 100
              : 0;

    if (daysLeft < 0) {
        const ago = Math.abs(daysLeft);
        return {
            key: 'ended',
            totalDays,
            daysLeft,
            progress: 100,
            text: `Encerrou há ${ago} ${ago === 1 ? 'dia' : 'dias'}`,
        };
    }
    if (daysLeft <= 7) {
        return {
            key: 'ending',
            totalDays,
            daysLeft,
            progress,
            text:
                daysLeft === 0
                    ? 'Termina hoje'
                    : `Termina em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`,
        };
    }
    return {
        key: 'active',
        totalDays,
        daysLeft,
        progress,
        text: `Faltam ${daysLeft} dias`,
    };
}

/**
 * Barra na cor do selo de status: preenchimento = cor do texto/ponto do
 * DsBadge, trilho = fundo do DsBadge (mesmos tokens, claro e escuro).
 */
const BAR_COLOR: Record<UiStatus, { fill: string; track: string }> = {
    not_viewed: {
        fill: 'bg-[var(--ds-color-warning-content)] ds-dark:bg-ds-status-warning-content',
        track: 'bg-[var(--ds-color-warning-surface)] ds-dark:bg-ds-status-warning-surface',
    },
    viewed: {
        fill: 'bg-[var(--ds-color-info-content)] ds-dark:bg-ds-status-info-content',
        track: 'bg-[var(--ds-color-info-surface)] ds-dark:bg-ds-status-info-surface',
    },
    completed: {
        fill: 'bg-[var(--ds-color-success-content)] ds-dark:bg-ds-status-success-content',
        track: 'bg-[var(--ds-color-success-surface)] ds-dark:bg-ds-status-success-surface',
    },
    draft: {
        fill: 'bg-ds-content-muted',
        track: 'bg-ds-surface-subtle',
    },
};

/** Barra fina do período do programa + texto "Faltam N dias". */
export function ValidityBar({
    program,
    compact = false,
}: {
    program: Program;
    compact?: boolean;
}) {
    const v = validityOf(program);
    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-ds-caption">
                <span className="truncate text-ds-content-secondary">
                    {!program.startDate && !program.endDate
                        ? 'Sem datas definidas'
                        : `${formatShort(program.startDate)} → ${
                              program.endDate
                                  ? formatShort(program.endDate)
                                  : 'sem fim'
                          }`}
                    {!compact && v.totalDays !== null && (
                        <span className="text-ds-content-muted">
                            {' '}
                            · {v.totalDays} dias
                        </span>
                    )}
                </span>
                <span
                    className={dsCn(
                        'shrink-0 font-medium',
                        v.key === 'ending'
                            ? 'text-ds-status-warning-content'
                            : 'text-ds-content-muted',
                    )}
                >
                    {program.startDate || program.endDate ? v.text : null}
                </span>
            </div>
            <div
                className={dsCn(
                    'h-1.5 overflow-hidden rounded-ds-pill',
                    BAR_COLOR[uiStatusOf(program)].track,
                )}
            >
                <div
                    className={dsCn(
                        'h-full rounded-ds-pill',
                        BAR_COLOR[uiStatusOf(program)].fill,
                    )}
                    style={{ width: `${v.key === 'open' ? 0 : v.progress}%` }}
                />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- avatar

function initialOf(name: string | null): string {
    return name?.trim()[0]?.toUpperCase() ?? '?';
}

export function PersonAvatar({
    name,
    photoUrl,
    size = 44,
}: {
    name: string | null;
    photoUrl: string | null;
    size?: number;
}) {
    return (
        <span
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-ds-full bg-ds-surface-brand-subtle font-semibold text-ds-content-brand ds-dark:text-ds-primary-60"
            style={{
                width: size,
                height: size,
                fontSize: Math.round(size * 0.38),
            }}
        >
            {photoUrl ? (
                <img src={photoUrl} alt="" className="size-full object-cover" />
            ) : (
                initialOf(name)
            )}
        </span>
    );
}

// ---------------------------------------------------------------- ações

export type ActionKey =
    | 'link'
    | 'pdf'
    | 'text'
    | 'duplicate'
    | 'model'
    | 'delete';

export interface ProgramAction {
    key: ActionKey;
    label: string;
    icon: ReactNode;
    danger?: boolean;
    visible?: (p: Program) => boolean;
}

export const PROGRAM_ACTIONS: ProgramAction[] = [
    {
        key: 'link',
        label: 'Copiar link do programa',
        icon: <Link2 />,
        visible: (p) => Boolean(p.patientId),
    },
    { key: 'pdf', label: 'Baixar PDF', icon: <FileDown /> },
    { key: 'text', label: 'Texto para prontuário', icon: <FileText /> },
    { key: 'duplicate', label: 'Duplicar', icon: <Copy /> },
    { key: 'model', label: 'Transformar em modelo', icon: <BookmarkCheck /> },
    {
        key: 'delete',
        label: 'Excluir rascunho',
        icon: <Trash2 />,
        danger: true,
        visible: (p) => p.status === 'draft',
    },
];

export function visibleActions(program: Program): ProgramAction[] {
    return PROGRAM_ACTIONS.filter((a) => !a.visible || a.visible(program));
}

/** Executa as ações. Copiar e PDF são reais; o que altera dados é stub. */
export function useProgramActions() {
    const [toDelete, setToDelete] = useState<Program | null>(null);
    const [shown, setShown] = useState<Program | null>(null);
    if (toDelete && toDelete !== shown) setShown(toDelete);

    const run = useCallback(async (key: ActionKey, program: Program) => {
        switch (key) {
            case 'pdf':
                downloadProgramPdf(program.id);
                return;
            case 'text': {
                try {
                    const full = await findClinicProgram(program.id);
                    const text = full
                        ? formatProgramClinicalRecordText(full)
                        : '';
                    if (!text) {
                        toast.error('Programa sem exercícios para copiar.');
                        return;
                    }
                    await navigator.clipboard.writeText(text);
                    toast.success(
                        'Texto copiado para a área de transferência.',
                    );
                } catch {
                    toast.error('Não foi possível copiar o texto.');
                }
                return;
            }
            case 'link': {
                try {
                    const full = await findClinicProgram(program.id);
                    if (!full?.shareUrl) {
                        toast.error(
                            'Link de acesso indisponível para este programa.',
                        );
                        return;
                    }
                    await navigator.clipboard.writeText(full.shareUrl);
                    toast.success('Link do programa copiado.');
                } catch {
                    toast.error('Não foi possível copiar o link.');
                }
                return;
            }
            case 'duplicate':
                toast.info(`Protótipo: "${program.title}" não foi duplicado.`);
                return;
            case 'model':
                toast.info(`Protótipo: "${program.title}" não virou modelo.`);
                return;
            case 'delete':
                setToDelete(program);
                return;
        }
    }, []);

    const deleteModal = (
        <DsModal
            open={toDelete !== null}
            onOpenChange={(open) => !open && setToDelete(null)}
            title="Excluir rascunho"
            size="sm"
            footer={
                <div className="flex w-full justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        onClick={() => setToDelete(null)}
                    />
                    <DsButton
                        variant="destructive"
                        label="Excluir"
                        onClick={() => {
                            toast.info('Protótipo: nada foi excluído.');
                            setToDelete(null);
                        }}
                    />
                </div>
            }
        >
            <p className="text-ds-body-sm text-ds-content-secondary">
                Excluir <strong>“{shown?.title}”</strong>? Esta ação não pode
                ser desfeita.
            </p>
        </DsModal>
    );

    return { run, deleteModal };
}

const menuItem =
    'flex w-full cursor-pointer items-center gap-2 rounded-ds-md px-3 py-[9px] text-left font-ds text-ds-body-xs font-medium whitespace-nowrap outline-none transition-[background] duration-100 data-[highlighted]:bg-ds-surface-subtle [&_svg]:size-4';

/** Menu "mais ações" (kebab). Mesmo visual do menu Opções do DsTable. */
export function ProgramActionsMenu({
    program,
    onAction,
    trigger,
    exclude = [],
}: {
    program: Program;
    onAction: (key: ActionKey, program: Program) => void;
    trigger?: ReactNode;
    exclude?: ActionKey[];
}) {
    const actions = visibleActions(program).filter(
        (a) => !exclude.includes(a.key),
    );
    return (
        <DropdownMenu.Root modal={false}>
            <DsTooltip content="Mais ações" asChild>
                <DropdownMenu.Trigger asChild>
                    {trigger ?? (
                        <button
                            type="button"
                            aria-label="Mais ações"
                            className="flex size-9 cursor-pointer items-center justify-center rounded-ds-md text-ds-content-secondary transition-colors hover:bg-ds-surface-brand-subtle hover:text-ds-content-brand focus-visible:shadow-ds-focus focus-visible:outline-0 data-[state=open]:bg-ds-surface-brand-subtle ds-dark:hover:text-ds-primary-60 [&_svg]:size-4"
                        >
                            <MoreHorizontal />
                        </button>
                    )}
                </DropdownMenu.Trigger>
            </DsTooltip>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    collisionPadding={8}
                    className="z-[9999] min-w-48 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-1 font-ds shadow-ds-md"
                >
                    {actions.map((a) => (
                        <DropdownMenu.Item
                            key={a.key}
                            onSelect={() => onAction(a.key, program)}
                            className={dsCn(
                                menuItem,
                                a.danger
                                    ? 'text-ds-danger-120 ds-dark:text-ds-status-danger-content [&_svg]:text-current'
                                    : 'text-ds-content-primary [&_svg]:text-ds-content-muted',
                            )}
                        >
                            {a.icon}
                            {a.label}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

// ---------------------------------------------------------------- filtros

export interface HistoryFilters {
    search: string;
    statuses: UiStatus[];
    professionalIds: string[];
    validity: ValidityKey | 'all';
    createdFrom: string | null;
    createdTo: string | null;
    page: number;
    perPage: number;
}

export const INITIAL_FILTERS: HistoryFilters = {
    search: '',
    statuses: [],
    professionalIds: [],
    validity: 'all',
    createdFrom: null,
    createdTo: null,
    page: 1,
    perPage: 16,
};

export const PER_PAGE_OPTIONS = [16, 32, 50].map((n) => ({
    value: String(n),
    label: String(n),
}));

export function activeFilterCount(f: HistoryFilters): number {
    return (
        f.statuses.length +
        f.professionalIds.length +
        (f.validity !== 'all' ? 1 : 0) +
        (f.createdFrom ? 1 : 0)
    );
}

function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

/** Filtro local (protótipo). Na tela real isso vira parâmetro da API. */
export function applyFilters(
    programs: Program[],
    f: HistoryFilters,
    patientId: string | null,
): Program[] {
    const q = normalize(f.search.trim());
    const from = parseDate(f.createdFrom);
    const to = parseDate(f.createdTo);
    return programs.filter((p) => {
        if (patientId && p.patientId !== patientId) return false;
        if (
            q &&
            !normalize(
                `${p.title} ${p.patientName ?? ''} ${p.professionalName ?? ''}`,
            ).includes(q)
        ) {
            return false;
        }
        if (f.statuses.length && !f.statuses.includes(uiStatusOf(p))) {
            return false;
        }
        if (
            f.professionalIds.length &&
            (!p.professionalId || !f.professionalIds.includes(p.professionalId))
        ) {
            return false;
        }
        if (f.validity !== 'all' && validityOf(p).key !== f.validity) {
            return false;
        }
        const created = parseDate(p.createdAt);
        if (from && created && created < from) return false;
        if (to && created && created.getTime() >= to.getTime() + DAY) {
            return false;
        }
        return true;
    });
}

function multiLabel(name: string, selected: string[]): string {
    if (selected.length === 0) return name;
    if (selected.length === 1) return selected[0] as string;
    return `${name} (${selected.length})`;
}

export function historyChips(
    f: HistoryFilters,
    professionals: { id: string; name: string }[],
    patientName: string | null,
): FilterChip[] {
    const chips: FilterChip[] = [];
    if (patientName) {
        chips.push({ key: 'patient', label: 'Paciente', value: patientName });
    }
    for (const s of f.statuses) {
        chips.push({
            key: `status:${s}`,
            label: 'Status',
            value: STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s,
        });
    }
    for (const id of f.professionalIds) {
        chips.push({
            key: `prof:${id}`,
            label: 'Profissional',
            value: professionals.find((p) => p.id === id)?.name ?? id,
        });
    }
    if (f.validity !== 'all') {
        chips.push({
            key: 'validity',
            label: 'Validade',
            value: VALIDITY_LABELS[f.validity],
        });
    }
    if (f.createdFrom) {
        chips.push({
            key: 'created',
            label: 'Criado',
            value: `${formatLong(f.createdFrom)} a ${formatLong(f.createdTo ?? f.createdFrom)}`,
        });
    }
    return chips;
}

export function removeChip(
    f: HistoryFilters,
    chip: FilterChip,
): Partial<HistoryFilters> {
    const [kind, value] = chip.key.split(':') as [string, string | undefined];
    if (kind === 'status') {
        return { statuses: f.statuses.filter((s) => s !== value) };
    }
    if (kind === 'prof') {
        return {
            professionalIds: f.professionalIds.filter((id) => id !== value),
        };
    }
    if (kind === 'validity') return { validity: 'all' };
    if (kind === 'created') return { createdFrom: null, createdTo: null };
    return {};
}

export interface FiltersProps {
    filters: HistoryFilters;
    professionals: { id: string; name: string }[];
    onChange: (patch: Partial<HistoryFilters>) => void;
}

function CreatedRange({
    filters,
    onChange,
    placeholder,
}: Omit<FiltersProps, 'professionals'> & { placeholder: string }) {
    const value: DateRange = {
        start: isoToDate(filters.createdFrom),
        end: isoToDate(filters.createdTo),
    };
    return (
        <DsDatepicker
            placeholder={placeholder}
            value={value}
            onValueChange={(v) => {
                const range = v && !(v instanceof Date) ? v : null;
                onChange({
                    createdFrom: dateToIso(range?.start ?? null),
                    createdTo: range?.start ? dateToIso(range.end) : null,
                });
            }}
        />
    );
}

const VALIDITY_ITEMS = [
    { key: 'all', label: 'Qualquer validade' },
    ...(Object.keys(VALIDITY_LABELS) as ValidityKey[]).map((key) => ({
        key,
        label: VALIDITY_LABELS[key],
    })),
];

/** Barra do computador: um dropdown por filtro (igual à de pacientes). */
export function HistoryFiltersBar({
    filters,
    professionals,
    onChange,
}: FiltersProps) {
    return (
        <>
            <CreatedRange
                filters={filters}
                onChange={onChange}
                placeholder="Criado entre"
            />
            <DsDropdown
                mode="checkbox"
                label="Status"
                icon={<CircleDot />}
                fixedLabel={multiLabel(
                    'Status',
                    STATUS_OPTIONS.filter((o) =>
                        filters.statuses.includes(o.value),
                    ).map((o) => o.label),
                )}
                items={STATUS_OPTIONS.map((o) => ({
                    key: o.value,
                    label: o.label,
                }))}
                value={filters.statuses}
                onValueChange={(v) => onChange({ statuses: v as UiStatus[] })}
            />
            <DsDropdown
                mode="radio"
                label="Validade"
                icon={<CalendarClock />}
                fixedLabel={
                    filters.validity === 'all'
                        ? 'Validade'
                        : VALIDITY_LABELS[filters.validity]
                }
                items={VALIDITY_ITEMS}
                value={filters.validity}
                onValueChange={(v) =>
                    onChange({ validity: v as HistoryFilters['validity'] })
                }
            />
            {professionals.length > 0 && (
                <DsDropdown
                    mode="checkbox"
                    label="Profissional"
                    icon={<UserRound />}
                    menuWidth={260}
                    menuAlign="right"
                    fixedLabel={multiLabel(
                        'Profissional',
                        professionals
                            .filter((p) =>
                                filters.professionalIds.includes(p.id),
                            )
                            .map((p) => p.name),
                    )}
                    items={professionals.map((p) => ({
                        key: p.id,
                        label: p.name,
                    }))}
                    value={filters.professionalIds}
                    onValueChange={(v) =>
                        onChange({ professionalIds: v as string[] })
                    }
                />
            )}
        </>
    );
}

function FacetGroup({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <fieldset className="flex flex-col gap-3 border-b border-ds-border-subtle pb-5 last:border-b-0">
            <legend className="mb-3 text-ds-body-sm font-semibold text-ds-content-primary">
                {title}
            </legend>
            {children}
        </fieldset>
    );
}

function toggle<T>(list: T[], item: T, on: boolean): T[] {
    return on ? [...list, item] : list.filter((x) => x !== item);
}

/** Gaveta do celular: os mesmos filtros, em grupos. */
export function HistoryFiltersPanel({
    filters,
    professionals,
    onChange,
}: FiltersProps) {
    return (
        <div className="flex flex-col gap-5">
            <FacetGroup title="Criado entre">
                <CreatedRange
                    filters={filters}
                    onChange={onChange}
                    placeholder="Qualquer data"
                />
            </FacetGroup>
            <FacetGroup title="Status">
                {STATUS_OPTIONS.map((o) => (
                    <DsCheckbox
                        key={o.value}
                        label={o.label}
                        checked={filters.statuses.includes(o.value)}
                        onCheckedChange={(on) =>
                            onChange({
                                statuses: toggle(
                                    filters.statuses,
                                    o.value,
                                    on === true,
                                ),
                            })
                        }
                    />
                ))}
            </FacetGroup>
            <FacetGroup title="Validade">
                <DsRadioGroup
                    name="validade"
                    value={filters.validity}
                    onValueChange={(v) =>
                        onChange({ validity: v as HistoryFilters['validity'] })
                    }
                >
                    {VALIDITY_ITEMS.map((i) => (
                        <DsRadio key={i.key} value={i.key} label={i.label} />
                    ))}
                </DsRadioGroup>
            </FacetGroup>
            {professionals.length > 0 && (
                <FacetGroup title="Profissional">
                    {professionals.map((p) => (
                        <DsCheckbox
                            key={p.id}
                            label={p.name}
                            checked={filters.professionalIds.includes(p.id)}
                            onCheckedChange={(on) =>
                                onChange({
                                    professionalIds: toggle(
                                        filters.professionalIds,
                                        p.id,
                                        on === true,
                                    ),
                                })
                            }
                        />
                    ))}
                </FacetGroup>
            )}
        </div>
    );
}

// ---------------------------------------------------------------- variantes

export interface VariantProps {
    programs: Program[];
    onAction: (key: ActionKey, program: Program) => void;
}

export function programPath(program: Program): string {
    return `/clinica/programas/${program.id}`;
}

export function exerciseCountLabel(n: number): string {
    return `${n} ${n === 1 ? 'exercício' : 'exercícios'}`;
}
