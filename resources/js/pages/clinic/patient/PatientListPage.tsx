import { Plus, Rows3, Search, SlidersHorizontal } from 'lucide-react';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { patientDisplayName, usePatients } from '@/application/clinic';
import {
    PATIENT_LIST_PER_PAGE_OPTIONS,
    toPatientListParams,
    type PatientListFilters,
} from '@/application/clinic/patient-list-filters';
import { can } from '@/application/clinic/permissions';
import { useClinicProfessionals } from '@/application/clinic/use-clinic-users';
import {
    useBulkInactivatePatients,
    useReactivatePatient,
} from '@/application/clinic/use-patients';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    DsButton,
    DsDrawer,
    DsDropdown,
    DsEmptyState,
    DsFieldSelect,
    DsFilterChips,
    DsInput,
    DsPagination,
} from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import type { Patient } from '@/domain/clinic/patient';

import {
    activePatientFilterCount,
    clearedPatientListFilters,
    patientListChips,
    removePatientListChip,
} from './patient-list/patient-list-chips';
import {
    activationModeOf,
    PatientActivationButton,
    PatientActivationModal,
    type ActivationMode,
} from './patient-list/PatientActivation';
import { PatientCard } from './patient-list/PatientCard';
import {
    PatientFiltersBar,
    PatientFiltersPanel,
} from './patient-list/PatientFilters';
import { usePatientListUrlState } from './patient-list/use-patient-list-url-state';

const NEW_PATIENT_PATH = '/clinica/pacientes/novo';

const PER_PAGE_OPTIONS = PATIENT_LIST_PER_PAGE_OPTIONS.map((n) => ({
    value: String(n),
    label: String(n),
}));

/** Busca ou algum filtro ligado (itens por página não conta). */
function isFiltered(filters: PatientListFilters): boolean {
    return filters.search !== '' || activePatientFilterCount(filters) > 0;
}

function totalLabel(total: number, filtered: boolean): string {
    const noun = total === 1 ? 'paciente' : 'pacientes';
    if (filtered) {
        return `${total} ${noun} ${total === 1 ? 'encontrado' : 'encontrados'}`;
    }
    return `${total} ${noun} ${total === 1 ? 'cadastrado' : 'cadastrados'}`;
}

function CardSkeletons() {
    return (
        <div
            aria-label="Carregando pacientes"
            className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
        >
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="h-56 animate-pulse rounded-ds-xl bg-ds-surface-subtle"
                />
            ))}
        </div>
    );
}

/**
 * Lista de pacientes da clínica (tela v2): um cartão por paciente, com a
 * busca, os filtros e a página guardados na URL.
 */
export default function PatientListPage() {
    const navigate = useNavigate();
    const perPageId = useId();
    const { filters, update, searchInput, setSearchInput } =
        usePatientListUrlState();
    const { data, isLoading, isError } = usePatients(
        toPatientListParams(filters),
    );
    const { data: professionals = [] } = useClinicProfessionals();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { user } = useAuth();
    const role = user?.role as ClinicRole | undefined;
    const inactivate = useBulkInactivatePatients();
    const reactivate = useReactivatePatient();
    const [pendingChange, setPendingChange] = useState<{
        patient: Patient;
        mode: ActivationMode;
    } | null>(null);
    // O modal continua mostrando o último paciente durante a animação de
    // saída, em vez de piscar o título vazio e o botão de inativar.
    const [shownChange, setShownChange] = useState(pendingChange);
    if (pendingChange && pendingChange !== shownChange) {
        setShownChange(pendingChange);
    }
    const allowedToChange: Record<ActivationMode, boolean> = {
        inactivate: can.bulkInactivate(role),
        reactivate: can.reactivate(role),
    };

    const confirmChange = () => {
        if (!pendingChange) return;
        const { patient, mode } = pendingChange;
        const onError = () =>
            toast.error(
                `Não foi possível ${mode === 'inactivate' ? 'inativar' : 'reativar'} o paciente.`,
            );
        if (mode === 'inactivate') {
            inactivate.mutate([patient.id], {
                onSuccess: (count) => {
                    // count 0: o paciente sumiu (apagado ou de outra clínica).
                    if (count === 0) {
                        toast.error(
                            'Paciente não encontrado. A lista foi atualizada.',
                        );
                    } else {
                        toast.success(
                            `${patientDisplayName(patient)} foi inativado.`,
                        );
                    }
                    setPendingChange(null);
                },
                onError,
            });
        } else {
            reactivate.mutate(patient.id, {
                onSuccess: () => {
                    toast.success(
                        `${patientDisplayName(patient)} foi reativado.`,
                    );
                    setPendingChange(null);
                },
                onError,
            });
        }
    };

    const patients = data?.data ?? [];
    const total = data?.total ?? 0;
    const filtered = isFiltered(filters);
    const filterCount = activePatientFilterCount(filters);
    const chips = patientListChips(filters, professionals);

    const clearFilters = () => update(clearedPatientListFilters());

    const newPatient = () => navigate(NEW_PATIENT_PATH);

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                {/* O <main> é do ClinicLayout. */}
                <div className="px-4 py-6 sm:px-6 sm:py-8">
                    {/* Largura máxima = breakpoint xl do DS (1920px). */}
                    <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6">
                        <header className="flex flex-wrap items-center gap-4">
                            <div className="mr-auto">
                                <h1 className="text-ds-page-title">
                                    Pacientes
                                </h1>
                                <p className="mt-1 text-ds-body-sm text-ds-content-secondary">
                                    {isLoading
                                        ? 'Carregando pacientes…'
                                        : totalLabel(total, filtered)}
                                </p>
                            </div>
                            {/* Celular: só o "+", para caber ao lado do título. */}
                            <div className="sm:hidden">
                                <DsButton
                                    iconPosition="only"
                                    icon={<Plus />}
                                    label="Novo paciente"
                                    onClick={newPatient}
                                />
                            </div>
                            <div className="hidden sm:block">
                                <DsButton
                                    iconPosition="left"
                                    icon={<Plus />}
                                    label="Novo paciente"
                                    onClick={newPatient}
                                />
                            </div>
                        </header>

                        <section
                            aria-label="Busca e filtros"
                            className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs"
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="min-w-0 flex-1 basis-65">
                                    <DsInput
                                        type="search"
                                        aria-label="Pesquisar pacientes"
                                        placeholder="Pesquisar por nome, apelido, CPF ou e-mail"
                                        iconLeft={<Search />}
                                        value={searchInput}
                                        onValueChange={setSearchInput}
                                        onCleared={() => setSearchInput('')}
                                    />
                                </div>
                                <div className="hidden flex-wrap items-center gap-3 md:flex">
                                    <PatientFiltersBar
                                        filters={filters}
                                        professionals={professionals}
                                        onChange={update}
                                    />
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
                                        value={String(filters.perPage)}
                                        onValueChange={(v) =>
                                            update({ perPage: Number(v) })
                                        }
                                    />
                                </div>
                                <div className="md:hidden">
                                    <DsButton
                                        variant={
                                            filterCount > 0
                                                ? 'primary'
                                                : 'secondary'
                                        }
                                        iconPosition="left"
                                        icon={<SlidersHorizontal />}
                                        label={
                                            filterCount > 0
                                                ? `Filtros (${filterCount})`
                                                : 'Filtros'
                                        }
                                        onClick={() => setDrawerOpen(true)}
                                    />
                                </div>
                            </div>
                            {/* Altura fixa: a caixa não cresce com o primeiro filtro. */}
                            <div className="flex min-h-8 items-center">
                                {chips.length > 0 ? (
                                    <DsFilterChips
                                        chips={chips}
                                        onRemove={(chip) =>
                                            update(
                                                removePatientListChip(
                                                    filters,
                                                    chip,
                                                ),
                                            )
                                        }
                                        onClear={clearFilters}
                                    />
                                ) : (
                                    <span className="text-ds-body-compact text-ds-content-muted">
                                        Nenhum filtro aplicado
                                    </span>
                                )}
                            </div>
                        </section>

                        {/* Celular: os dropdowns da barra somem, então os itens por página vêm aqui. */}
                        <div className="-mt-2 flex items-center justify-end gap-2 md:hidden">
                            <label
                                htmlFor={perPageId}
                                className="text-ds-body-compact whitespace-nowrap text-ds-content-muted"
                            >
                                Itens por página
                            </label>
                            <div className="w-24">
                                <DsFieldSelect
                                    id={perPageId}
                                    size="sm"
                                    options={PER_PAGE_OPTIONS}
                                    value={String(filters.perPage)}
                                    onValueChange={(v) =>
                                        update({ perPage: Number(v) })
                                    }
                                />
                            </div>
                        </div>

                        {/* Lista vazia com total > 0: página que já não existe, a caminho da última. */}
                        {isLoading || (patients.length === 0 && total > 0) ? (
                            <CardSkeletons />
                        ) : isError ? (
                            <DsEmptyState
                                variant="error"
                                title="Erro ao carregar pacientes"
                                description="Tente de novo em alguns instantes."
                            />
                        ) : patients.length === 0 && !filtered ? (
                            <DsEmptyState
                                variant="empty"
                                title="Nenhum paciente cadastrado"
                                description="Cadastre o primeiro paciente da clínica."
                                action={
                                    <DsButton
                                        iconPosition="left"
                                        icon={<Plus />}
                                        label="Novo paciente"
                                        onClick={newPatient}
                                    />
                                }
                            />
                        ) : patients.length === 0 ? (
                            <DsEmptyState
                                variant="no-results"
                                title="Nenhum paciente encontrado"
                                action={
                                    filterCount > 0 ? (
                                        <DsButton
                                            variant="secondary"
                                            label="Limpar filtros"
                                            onClick={clearFilters}
                                        />
                                    ) : undefined
                                }
                            />
                        ) : (
                            <ul
                                aria-label="Pacientes"
                                className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
                            >
                                {patients.map((p) => (
                                    <li key={p.id}>
                                        <PatientCard
                                            patient={p}
                                            action={
                                                <PatientActivationButton
                                                    mode={activationModeOf(p)}
                                                    allowed={
                                                        allowedToChange[
                                                            activationModeOf(p)
                                                        ]
                                                    }
                                                    onRequest={() =>
                                                        setPendingChange({
                                                            patient: p,
                                                            mode: activationModeOf(
                                                                p,
                                                            ),
                                                        })
                                                    }
                                                />
                                            }
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Página que já não existe: o DsPagination pede a última. */}
                        <DsPagination
                            page={filters.page}
                            onPageChange={(page) => update({ page })}
                            total={total}
                            perPage={filters.perPage}
                            itemLabel="pacientes"
                        />
                    </div>
                </div>
            </div>
            <PatientActivationModal
                open={pendingChange !== null}
                patient={shownChange?.patient ?? null}
                mode={shownChange?.mode ?? 'inactivate'}
                pending={inactivate.isPending || reactivate.isPending}
                onConfirm={confirmChange}
                onCancel={() => setPendingChange(null)}
            />
            <DsDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                placement="bottom"
                title="Filtros"
                footer={
                    <div className="flex w-full items-center gap-3">
                        <DsButton
                            variant="tertiary"
                            label="Limpar"
                            disabled={chips.length === 0}
                            onClick={clearFilters}
                        />
                        <div className="ml-auto">
                            <DsButton
                                label={`Ver ${total} ${total === 1 ? 'paciente' : 'pacientes'}`}
                                onClick={() => setDrawerOpen(false)}
                            />
                        </div>
                    </div>
                }
            >
                <PatientFiltersPanel
                    filters={filters}
                    professionals={professionals}
                    onChange={update}
                />
            </DsDrawer>
        </ClinicLayout>
    );
}
