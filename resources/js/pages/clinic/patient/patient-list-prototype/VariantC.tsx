import {
    CircleDot,
    Plus,
    Rows3,
    Search,
    SlidersHorizontal,
    ToggleRight,
    UserRound,
} from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

import {
    DsButton,
    DsCard,
    DsCheckbox,
    DsDatepicker,
    DsDrawer,
    DsDropdown,
    DsEmptyState,
    DsFieldSelect,
    DsFilterChips,
    DsInput,
    DsPagination,
    DsRadio,
    DsRadioGroup,
    type FilterChip,
} from '@/components/ds';
import type { Patient, PatientStatus } from '@/domain/clinic/patient';

import { CardActions } from './CardActions';
import {
    PATIENT_LINKS,
    PatientAvatar,
    PatientListShell,
    PatientStatusBadge,
    STATUS_OPTIONS,
    type ActiveFilter,
    type PatientListState,
} from './shared';

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

function PatientCard({
    patient,
    state,
}: {
    patient: Patient;
    state: PatientListState;
}) {
    const [prontuario] = PATIENT_LINKS;
    return (
        <DsCard
            variant="interactive"
            className="group relative flex h-full cursor-pointer flex-col overflow-hidden"
            onClick={() => state.navigate(prontuario!.path(patient))}
        >
            <div className="flex items-start gap-3">
                <PatientAvatar patient={patient} size={44} />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-ds-body-emphasis">
                        {patient.name}
                    </p>
                    <p className="truncate text-ds-caption text-ds-content-secondary">
                        por {patient.professional || '—'}
                    </p>
                </div>
            </div>
            <div className="mt-3">
                <PatientStatusBadge status={patient.status} />
            </div>
            <p className="mt-3 line-clamp-3 min-h-[3lh] flex-1 text-ds-body-sm text-ds-content-secondary">
                {patient.diagnosis || (
                    <span className="text-ds-content-muted">
                        Sem diagnóstico registrado.
                    </span>
                )}
            </p>
            <CardActions patient={patient} state={state} />
        </DsCard>
    );
}

/** Grupos de filtro: os mesmos na coluna (computador) e na gaveta (celular). */
function PatientFilters({ state: s }: { state: PatientListState }) {
    const allProfessionals =
        s.clinicUsers.length > 0 &&
        s.professionalIds.length === s.clinicUsers.length;

    return (
        <>
            <FacetGroup title="Cadastrado entre">
                <DsDatepicker
                    placeholder="Qualquer data"
                    value={s.range}
                    onValueChange={(v) =>
                        s.setRange(
                            v && !(v instanceof Date)
                                ? v
                                : { start: null, end: null },
                        )
                    }
                />
            </FacetGroup>

            <FacetGroup title="Situação">
                <DsRadioGroup
                    name="situacao"
                    value={s.active}
                    onValueChange={(v) => s.setActive(v as ActiveFilter)}
                >
                    <DsRadio value="todos" label="Todos" />
                    <DsRadio value="ativos" label="Ativos" />
                    <DsRadio value="inativos" label="Inativos" />
                </DsRadioGroup>
            </FacetGroup>

            <FacetGroup title="Status">
                {STATUS_OPTIONS.map((o) => (
                    <DsCheckbox
                        key={o.value}
                        label={o.label}
                        checked={s.statuses.includes(o.value)}
                        onCheckedChange={(on) =>
                            s.setStatuses(
                                on
                                    ? [...s.statuses, o.value]
                                    : s.statuses.filter((x) => x !== o.value),
                            )
                        }
                    />
                ))}
            </FacetGroup>

            {s.clinicUsers.length > 0 && (
                <FacetGroup title="Profissional">
                    <DsCheckbox
                        label="Todos"
                        checked={allProfessionals}
                        indeterminate={
                            !allProfessionals && s.professionalIds.length > 0
                        }
                        onCheckedChange={() =>
                            s.setProfessionalIds(
                                allProfessionals
                                    ? []
                                    : s.clinicUsers.map((u) => u.id),
                            )
                        }
                    />
                    {s.clinicUsers.map((u) => (
                        <DsCheckbox
                            key={u.id}
                            label={u.name}
                            checked={s.professionalIds.includes(u.id)}
                            onCheckedChange={(on) =>
                                s.setProfessionalIds(
                                    on
                                        ? [...s.professionalIds, u.id]
                                        : s.professionalIds.filter(
                                              (x) => x !== u.id,
                                          ),
                                )
                            }
                        />
                    ))}
                </FacetGroup>
            )}
        </>
    );
}

function formatDay(d: Date): string {
    return d.toLocaleDateString('pt-BR');
}

/** Títulos que não contam como nome ("Dra. Ana Paula" → "Ana"). */
const HONORIFICS = new Set(['dr', 'dra', 'prof', 'profa', 'sr', 'sra']);

function firstName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    const name = parts.find(
        (p) => !HONORIFICS.has(p.replace(/\.$/, '').toLowerCase()),
    );
    return name ?? parts[0] ?? fullName;
}

/** Um chip por filtro aplicado, na mesma ordem da coluna de filtros. */
function activeChips(s: PatientListState): FilterChip[] {
    const chips: FilterChip[] = [];
    if (s.range.start) {
        chips.push({
            key: 'range',
            label: 'Cadastro',
            value: s.range.end
                ? `${formatDay(s.range.start)} – ${formatDay(s.range.end)}`
                : `a partir de ${formatDay(s.range.start)}`,
        });
    }
    if (s.active !== 'todos') {
        chips.push({
            key: 'active',
            label: 'Situação',
            value: s.active === 'ativos' ? 'Ativos' : 'Inativos',
        });
    }
    for (const st of s.statuses) {
        chips.push({
            key: `status:${st}`,
            label: 'Status',
            value: STATUS_OPTIONS.find((o) => o.value === st)?.label ?? st,
        });
    }
    // Vários profissionais cabem num chip só, com o primeiro nome de cada um.
    if (s.professionalIds.length > 0) {
        chips.push({
            key: 'prof',
            label:
                s.professionalIds.length === 1
                    ? 'Profissional'
                    : 'Profissionais',
            value: s.professionalIds
                .map((id) => {
                    const name = s.clinicUsers.find((u) => u.id === id)?.name;
                    return name ? firstName(name) : id;
                })
                .join(', '),
        });
    }
    if (s.perPage !== s.defaultPerPage) {
        chips.push({
            key: 'perPage',
            label: 'Itens por página',
            value: String(s.perPage),
        });
    }
    return chips;
}

function removeChip(s: PatientListState, chip: FilterChip) {
    const [kind, id] = chip.key.split(':');
    if (kind === 'range') s.setRange({ start: null, end: null });
    if (kind === 'active') s.setActive('todos');
    if (kind === 'status') s.setStatuses(s.statuses.filter((x) => x !== id));
    if (kind === 'prof') s.setProfessionalIds([]);
    if (kind === 'perPage') s.setPerPage(s.defaultPerPage);
}

/** "50 pacientes cadastrados", ou "3 pacientes encontrados" com busca/filtro. */
function totalLabel(s: PatientListState): string {
    if (s.isLoading) return 'Carregando pacientes…';
    const noun = s.total === 1 ? 'paciente' : 'pacientes';
    const filtered = s.activeFilterCount > 0 || s.search.trim() !== '';
    if (filtered) {
        return `${s.total} ${noun} ${s.total === 1 ? 'encontrado' : 'encontrados'}`;
    }
    return `${s.total} ${noun} ${s.total === 1 ? 'cadastrado' : 'cadastrados'}`;
}

/**
 * Múltiplos de 5 (cards por linha no 1470px), para fechar linhas inteiras.
 * Nunca acima de 50: é o máximo por página.
 */
const PER_PAGE_OPTIONS = [15, 30, 50].map((n) => ({
    value: String(n),
    label: String(n),
}));

const SITUACAO_ITEMS: { key: ActiveFilter; label: string }[] = [
    { key: 'todos', label: 'Ativos e inativos' },
    { key: 'ativos', label: 'Só ativos' },
    { key: 'inativos', label: 'Só inativos' },
];

/** Nada marcado: o nome; um: o próprio item; vários: "Nome (n)". */
function multiLabel(name: string, selected: string[]): string {
    if (selected.length === 0) return name;
    if (selected.length === 1) return selected[0]!;
    return `${name} (${selected.length})`;
}

/** Os filtros em dropdowns, na barra em cima dos cards (como a busca). */
function TopFilters({ state: s }: { state: PatientListState }) {
    return (
        <>
            <DsDatepicker
                placeholder="Cadastrado entre"
                value={s.range}
                onValueChange={(v) =>
                    s.setRange(
                        v && !(v instanceof Date)
                            ? v
                            : { start: null, end: null },
                    )
                }
            />
            <DsDropdown
                mode="radio"
                label="Situação"
                icon={<ToggleRight />}
                items={SITUACAO_ITEMS}
                value={s.active}
                onValueChange={(v) => s.setActive(v as ActiveFilter)}
            />
            <DsDropdown
                mode="checkbox"
                label="Status"
                icon={<CircleDot />}
                fixedLabel={multiLabel(
                    'Status',
                    STATUS_OPTIONS.filter((o) =>
                        s.statuses.includes(o.value),
                    ).map((o) => o.label),
                )}
                items={STATUS_OPTIONS.map((o) => ({
                    key: o.value,
                    label: o.label,
                }))}
                value={s.statuses}
                onValueChange={(v) => s.setStatuses(v as PatientStatus[])}
            />
            {s.clinicUsers.length > 0 && (
                <DsDropdown
                    mode="checkbox"
                    label="Profissional"
                    icon={<UserRound />}
                    menuWidth={260}
                    menuAlign="right"
                    fixedLabel={multiLabel(
                        'Profissional',
                        s.clinicUsers
                            .filter((u) => s.professionalIds.includes(u.id))
                            .map((u) => u.name),
                    )}
                    items={s.clinicUsers.map((u) => ({
                        key: u.id,
                        label: u.name,
                    }))}
                    value={s.professionalIds}
                    onValueChange={(v) => s.setProfessionalIds(v as string[])}
                />
            )}
        </>
    );
}

/**
 * C2 — cada paciente vira um cartão com o diagnóstico em 3 linhas e atalhos
 * no rodapé; clicar no cartão abre o prontuário. Os filtros ficam numa barra
 * em cima dos cards (busca + um dropdown por filtro + itens por página) e os
 * aplicados viram chips (DsFilterChips). No celular, o botão "Filtros" abre
 * os mesmos grupos numa gaveta de baixo.
 */
export function VariantC({ state }: { state: PatientListState }) {
    const s = state;
    const perPageId = useId();
    const [filtersOpen, setFiltersOpen] = useState(false);
    const filtersLabel =
        s.activeFilterCount > 0
            ? `Filtros (${s.activeFilterCount})`
            : 'Filtros';

    const search = (
        <DsInput
            type="search"
            placeholder="Pesquisar por nome, CPF ou e-mail"
            iconLeft={<Search />}
            value={s.search}
            onValueChange={s.setSearch}
            onCleared={() => s.setSearch('')}
        />
    );
    const drawerButton = (
        <DsButton
            variant={s.activeFilterCount > 0 ? 'primary' : 'secondary'}
            iconPosition="left"
            icon={<SlidersHorizontal />}
            label={filtersLabel}
            onClick={() => setFiltersOpen(true)}
        />
    );
    const applied = activeChips(s);
    // A linha dos chips sempre ocupa espaço: a caixa de filtros já nasce com a
    // altura final e não cresce quando o primeiro filtro é aplicado.
    const chips = (
        <div className="flex min-h-8 items-center">
            {applied.length > 0 ? (
                <DsFilterChips
                    chips={applied}
                    onRemove={(chip) => removeChip(s, chip)}
                    onClear={s.clearFilters}
                />
            ) : (
                <span className="text-[0.8125rem] text-ds-content-muted">
                    Nenhum filtro aplicado
                </span>
            )}
        </div>
    );

    return (
        <PatientListShell>
            <div className="flex min-h-full">
                <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
                    {/* Largura máxima = breakpoint xl do DS (1920px). */}
                    <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6">
                        <header className="flex flex-wrap items-center gap-4">
                            <div className="mr-auto">
                                <h1 className="text-ds-page-title">
                                    Pacientes
                                </h1>
                                <p className="mt-1 text-ds-body-sm text-ds-content-secondary">
                                    {totalLabel(s)}
                                </p>
                            </div>
                            {/* Celular: só o "+", para caber ao lado do título. */}
                            <div className="sm:hidden">
                                <DsButton
                                    iconPosition="only"
                                    icon={<Plus />}
                                    label="Novo paciente"
                                    onClick={() =>
                                        s.navigate('/clinica/pacientes/novo')
                                    }
                                />
                            </div>
                            <div className="hidden sm:block">
                                <DsButton
                                    iconPosition="left"
                                    icon={<Plus />}
                                    label="Novo paciente"
                                    onClick={() =>
                                        s.navigate('/clinica/pacientes/novo')
                                    }
                                />
                            </div>
                        </header>

                        <section className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="min-w-0 flex-1 basis-[260px]">
                                    {search}
                                </div>
                                <div className="hidden flex-wrap items-center gap-3 md:flex">
                                    <TopFilters state={s} />
                                    <DsDropdown
                                        mode="radio"
                                        label="Itens por página"
                                        icon={<Rows3 />}
                                        menuAlign="right"
                                        menuTitle="Itens por página"
                                        items={PER_PAGE_OPTIONS.map((o) => ({
                                            key: o.value,
                                            label: `${o.label} por página`,
                                        }))}
                                        value={String(s.perPage)}
                                        onValueChange={(v) =>
                                            s.setPerPage(Number(v))
                                        }
                                    />
                                </div>
                                <div className="md:hidden">{drawerButton}</div>
                            </div>
                            {chips}
                        </section>

                        {/* Celular: os dropdowns da barra somem, então os itens por página vêm aqui. */}
                        <div className="-mt-2 flex items-center justify-end gap-2 md:hidden">
                            <label
                                htmlFor={perPageId}
                                className="text-[0.8125rem] whitespace-nowrap text-ds-content-muted"
                            >
                                Itens por página
                            </label>
                            <div className="w-[96px]">
                                <DsFieldSelect
                                    id={perPageId}
                                    size="sm"
                                    options={PER_PAGE_OPTIONS}
                                    value={String(s.perPage)}
                                    onValueChange={(v) =>
                                        s.setPerPage(Number(v))
                                    }
                                />
                            </div>
                        </div>

                        {s.isLoading ? (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-[220px] animate-pulse rounded-ds-xl bg-ds-surface-subtle"
                                    />
                                ))}
                            </div>
                        ) : s.patients.length === 0 ? (
                            <DsEmptyState
                                variant={s.isError ? 'error' : 'no-results'}
                                title={
                                    s.isError
                                        ? 'Erro ao carregar pacientes'
                                        : 'Nenhum paciente encontrado'
                                }
                                action={
                                    s.activeFilterCount > 0 ? (
                                        <DsButton
                                            variant="secondary"
                                            label="Limpar filtros"
                                            onClick={s.clearFilters}
                                        />
                                    ) : undefined
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                                {s.patients.map((p) => (
                                    <PatientCard
                                        key={p.id}
                                        patient={p}
                                        state={s}
                                    />
                                ))}
                            </div>
                        )}

                        <DsPagination
                            page={s.page}
                            onPageChange={s.setPage}
                            total={s.total}
                            perPage={s.perPage}
                            itemLabel="pacientes"
                        />
                    </div>
                </main>
            </div>
            <DsDrawer
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                placement="bottom"
                title="Filtros"
                footer={
                    <div className="flex w-full items-center gap-3">
                        <DsButton
                            variant="tertiary"
                            label="Limpar"
                            disabled={s.activeFilterCount === 0}
                            onClick={s.clearFilters}
                        />
                        <div className="ml-auto">
                            <DsButton
                                label={`Ver ${s.total} ${s.total === 1 ? 'paciente' : 'pacientes'}`}
                                onClick={() => setFiltersOpen(false)}
                            />
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col gap-5">
                    <PatientFilters state={s} />
                </div>
            </DsDrawer>
        </PatientListShell>
    );
}
