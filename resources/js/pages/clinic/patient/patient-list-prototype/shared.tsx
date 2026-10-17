import { Calendar, ClipboardList, Dumbbell, Pencil, UserX } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { usePatients } from '@/application/clinic';
import { useClinicProfessionals } from '@/application/clinic/use-clinic-users';
import {
    DsBadge,
    dsCn,
    type BadgeVariant,
    type DateRange,
} from '@/components/ds';
import type { Patient, PatientStatus } from '@/domain/clinic/patient';

export const PATIENT_LIST_PROTOTYPE_VARIANTS = [
    { key: 'O', name: 'Original' },
    { key: 'C2', name: 'Cards + filtros e itens por página na barra' },
] as const;

export type ActiveFilter = 'todos' | 'ativos' | 'inativos';

export const STATUS_OPTIONS: {
    value: PatientStatus;
    label: string;
    variant: BadgeVariant;
}[] = [
    { value: 'em_tratamento', label: 'Em tratamento', variant: 'info' },
    { value: 'em_treinamento', label: 'Em treinamento', variant: 'success' },
    { value: 'em_prevencao', label: 'Em prevenção', variant: 'warning' },
    { value: 'alta', label: 'Alta', variant: 'primary' },
    { value: 'cancelado', label: 'Cancelado', variant: 'default' },
    { value: 'obito', label: 'Óbito', variant: 'danger' },
];

const STATUS_BY_VALUE = Object.fromEntries(
    STATUS_OPTIONS.map((s) => [s.value, s]),
) as Record<PatientStatus, (typeof STATUS_OPTIONS)[number]>;

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
    const s = STATUS_BY_VALUE[status];
    return (
        <DsBadge variant={s?.variant ?? 'default'} dot>
            {s?.label ?? status}
        </DsBadge>
    );
}

function toIsoDate(d: Date | null): string | undefined {
    if (!d) return undefined;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Tudo que a PatientListPage já fazia (busca com debounce, filtros, página),
 * para as variantes só trocarem a renderização. Inativar é stub: o protótipo
 * não grava nada.
 */
export function usePatientListState(initialPerPage = 10) {
    const navigate = useNavigate();
    const [search, setSearchRaw] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPageRaw] = useState(initialPerPage);
    const [statuses, setStatusesRaw] = useState<PatientStatus[]>([]);
    const [professionalIds, setProfessionalIdsRaw] = useState<string[]>([]);
    const [active, setActiveRaw] = useState<ActiveFilter>('todos');
    const [range, setRangeRaw] = useState<DateRange>({
        start: null,
        end: null,
    });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const resetPage =
        <A,>(setter: (v: A) => void) =>
        (v: A) => {
            setter(v);
            setPage(1);
        };

    const { data: clinicUsers = [] } = useClinicProfessionals();
    const { data, isLoading, isFetching, isError } = usePatients({
        page,
        perPage,
        search: debouncedSearch || undefined,
        isActive:
            active === 'todos' ? undefined : active === 'ativos' ? true : false,
        statuses: statuses.length > 0 ? statuses : undefined,
        professionalIds:
            professionalIds.length > 0 ? professionalIds : undefined,
        dateFrom: toIsoDate(range.start),
        dateTo: toIsoDate(range.end),
    });

    const activeFilterCount =
        statuses.length +
        professionalIds.length +
        (active !== 'todos' ? 1 : 0) +
        (range.start ? 1 : 0);

    // Também volta os itens por página ao padrão: eles aparecem como chip.
    const clearFilters = useCallback(() => {
        setStatusesRaw([]);
        setProfessionalIdsRaw([]);
        setActiveRaw('todos');
        setRangeRaw({ start: null, end: null });
        setPerPageRaw(initialPerPage);
        setPage(1);
    }, [initialPerPage]);

    const inactivate = useCallback((patients: Patient[]) => {
        toast.info(
            `Protótipo: inativaria ${patients.length} ${
                patients.length === 1 ? 'paciente' : 'pacientes'
            } (${patients.map((p) => p.name).join(', ')}).`,
        );
    }, []);

    return {
        navigate,
        search,
        setSearch: resetPage(setSearchRaw),
        page,
        setPage,
        perPage,
        defaultPerPage: initialPerPage,
        setPerPage: resetPage(setPerPageRaw),
        statuses,
        setStatuses: resetPage(setStatusesRaw),
        professionalIds,
        setProfessionalIds: resetPage(setProfessionalIdsRaw),
        active,
        setActive: resetPage(setActiveRaw),
        range,
        setRange: resetPage(setRangeRaw),
        activeFilterCount,
        clearFilters,
        clinicUsers,
        patients: data?.data ?? [],
        total: data?.total ?? 0,
        isLoading,
        isFetching,
        isError,
        inactivate,
    };
}

export type PatientListState = ReturnType<typeof usePatientListState>;

export interface PatientLink {
    key: string;
    label: string;
    icon: ReactNode;
    path: (patient: Patient) => string;
}

/** Mesmos destinos do menu "⋮" da tela atual. */
export const PATIENT_LINKS: PatientLink[] = [
    {
        key: 'prontuario',
        label: 'Prontuário',
        icon: <ClipboardList />,
        path: (p) => `/clinica/pacientes/${p.id}`,
    },
    {
        key: 'programas',
        label: 'Programas',
        icon: <Dumbbell />,
        path: (p) =>
            `/clinica/programas/historico?patientId=${p.id}&search=${encodeURIComponent(p.name)}`,
    },
    {
        key: 'agenda',
        label: 'Agendamentos',
        icon: <Calendar />,
        path: (p) => `/clinica/agenda?patientId=${p.id}`,
    },
    {
        key: 'editar',
        label: 'Editar perfil',
        icon: <Pencil />,
        path: (p) => `/clinica/pacientes/${p.id}/editar`,
    },
];

export const INACTIVATE_ICON = <UserX />;

export function PatientAvatar({
    patient,
    size = 36,
}: {
    patient: Pick<Patient, 'name' | 'initial' | 'photoUrl'>;
    size?: number;
}) {
    return (
        <span
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-ds-full bg-ds-surface-brand-subtle font-semibold text-ds-content-brand ds-dark:text-ds-primary-60"
            style={{
                width: size,
                height: size,
                fontSize: Math.round(size * 0.38),
            }}
        >
            {patient.photoUrl ? (
                <img
                    src={patient.photoUrl}
                    alt={patient.name}
                    className="size-full object-cover"
                />
            ) : (
                patient.initial
            )}
        </span>
    );
}

/** Raiz v2: rola no próprio contêiner (html/body da v1 têm overflow hidden). */
export function PatientListShell({
    children,
    className,
    ...rest
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...rest}
            className={dsCn(
                'h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary',
                className,
            )}
        >
            {children}
        </div>
    );
}
