import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DndContextProps,
    type DragEndEvent,
    type UniqueIdentifier,
} from '@dnd-kit/core';
import { Plus, Search, SlidersHorizontal, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { clinicUserLocks } from '@/application/clinic/clinic-user-locks';
import {
    useChangeClinicUserAccess,
    useClinicUsers,
    useDeleteClinicUser,
} from '@/application/clinic/use-clinic-users';
import {
    applyUserListFilters,
    DEFAULT_USER_LIST_FILTERS,
    sortTeam,
    type UserListFilters,
} from '@/application/clinic/user-list-filters';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    DsButton,
    DsDrawer,
    DsEmptyState,
    DsFilterChips,
    DsInput,
} from '@/components/ds';
import type { ClinicRole } from '@/domain/auth/session';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import { useIsMobile } from '@/hooks/use-mobile';

import { RoleAccordion } from './user-list/RoleAccordion';
import { RoleChangeModal, type RoleMove } from './user-list/RoleChangeModal';
import { ROLE_META } from './user-list/roles';
import { useUserListUrlState } from './user-list/use-user-list-url-state';
import {
    activeUserFilterCount,
    clearedUserListFilters,
    removeUserListChip,
    userListChips,
} from './user-list/user-list-chips';
import {
    statusActionOf,
    UserActionModal,
    type UserAction,
} from './user-list/UserActionModal';
import { UserCard, UserDragOverlay } from './user-list/UserCard';
import { UserDrawer } from './user-list/UserDrawer';
import { UserFiltersBar, UserFiltersPanel } from './user-list/UserFilters';

const NEW_USER_PATH = '/clinica/usuarios/novo';

function draggedName(data: { current?: { user?: ClinicUserSummary } }) {
    return data.current?.user?.name ?? 'a pessoa';
}

function roleName(id: UniqueIdentifier | undefined) {
    return id ? ROLE_META[id as ClinicRole].label : '';
}

/** O que o leitor de tela ouve no arraste (o padrão do dnd-kit é em inglês). */
const DRAG_ACCESSIBILITY: DndContextProps['accessibility'] = {
    screenReaderInstructions: {
        draggable:
            'Para mudar a função, aperte espaço ou Enter, use as setas até a função e aperte espaço ou Enter de novo. Esc cancela.',
    },
    announcements: {
        onDragStart: ({ active }) => `Arrastando ${draggedName(active.data)}.`,
        onDragOver: ({ active, over }) =>
            over
                ? `${draggedName(active.data)} sobre ${roleName(over.id)}.`
                : `${draggedName(active.data)} fora das funções.`,
        onDragEnd: ({ active, over }) =>
            over
                ? `${draggedName(active.data)} solto em ${roleName(over.id)}.`
                : `${draggedName(active.data)} solto fora das funções.`,
        onDragCancel: ({ active }) =>
            `Arraste de ${draggedName(active.data)} cancelado.`,
    },
};

function people(n: number): string {
    return `${n} ${n === 1 ? 'pessoa' : 'pessoas'}`;
}

/** "3 pessoas na equipe · 2 ativas". */
function teamSummary(team: ClinicUserSummary[]): string {
    const active = team.filter((u) => u.status).length;
    return `${people(team.length)} na equipe · ${active} ${active === 1 ? 'ativa' : 'ativas'}`;
}

function isFiltered(filters: UserListFilters): boolean {
    return filters.search !== '' || activeUserFilterCount(filters) > 0;
}

function CardSkeletons() {
    return (
        <div
            aria-label="Carregando usuários"
            className="grid gap-3 xl:grid-cols-2"
        >
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="h-24 animate-pulse rounded-ds-lg bg-ds-surface-subtle"
                />
            ))}
        </div>
    );
}

/**
 * Usuários da clínica (tela v2, só do administrador): a equipe em cartões de
 * um lado e as funções do sistema em sanfona do outro, com a busca e os
 * filtros guardados na URL.
 */
export function UserListPage() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { filters, update, searchInput, setSearchInput, flushSearch } =
        useUserListUrlState();
    const { data, isLoading, isError } = useClinicUsers();
    // Sem números (contagens, "0 pessoas") enquanto a equipe não chegou.
    const loaded = !isLoading && !isError;
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [openId, setOpenId] = useState<string | null>(null);

    const team = useMemo(() => sortTeam(data ?? []), [data]);
    const shown = useMemo(
        () => applyUserListFilters(team, filters),
        [team, filters],
    );
    // A pessoa do drawer vem da lista atual: depois de mudar algo, o drawer acompanha.
    const openUser = team.find((u) => u.id === openId) ?? null;
    // Travas de mestre e último admin ativo: contadas na equipe inteira.
    const roleLockOf = (u: ClinicUserSummary) =>
        clinicUserLocks(u, team).roleChange;

    const changeAccess = useChangeClinicUserAccess();
    const [move, setMove] = useState<RoleMove | null>(null);
    // O modal continua mostrando a última mudança durante a animação de saída.
    const [shownMove, setShownMove] = useState(move);
    if (move && move !== shownMove) setShownMove(move);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor),
    );

    const requestMove = (u: ClinicUserSummary, to: ClinicRole) => {
        if (to !== u.role && roleLockOf(u) === null) setMove({ user: u, to });
    };
    const onDragEnd = ({ active, over }: DragEndEvent) => {
        const u = team.find((x) => x.id === active.id);
        if (u && over) requestMove(u, over.id as ClinicRole);
    };
    const confirmMove = () => {
        if (!move) return;
        const { user, to } = move;
        changeAccess.mutate(
            { id: user.id, dto: { role: to } },
            {
                onSuccess: () => {
                    toast.success(
                        `${user.name} agora é ${ROLE_META[to].label}.`,
                    );
                    setMove(null);
                },
            },
        );
    };

    const deleteUser = useDeleteClinicUser();
    const [pendingAction, setPendingAction] = useState<{
        user: ClinicUserSummary;
        action: UserAction;
    } | null>(null);
    const [shownAction, setShownAction] = useState(pendingAction);
    if (pendingAction && pendingAction !== shownAction) {
        setShownAction(pendingAction);
    }
    const confirmAction = () => {
        if (!pendingAction) return;
        const { user, action } = pendingAction;
        if (action === 'delete') {
            deleteUser.mutate(user.id, {
                onSuccess: () => {
                    setPendingAction(null);
                    setOpenId(null);
                },
            });
            return;
        }
        const activate = action === 'reactivate';
        changeAccess.mutate(
            { id: user.id, dto: { status: activate ? 1 : 0 } },
            {
                onSuccess: () => {
                    toast.success(
                        `${user.name} foi ${activate ? 'reativado(a)' : 'desativado(a)'}.`,
                    );
                    setPendingAction(null);
                },
            },
        );
    };

    const chips = userListChips(filters);
    const filterCount = activeUserFilterCount(filters);
    const clearFilters = () => update(clearedUserListFilters());
    // Também a busca ainda no debounce, senão ela volta 400ms depois.
    const clearAll = () => {
        setSearchInput('');
        update(DEFAULT_USER_LIST_FILTERS);
    };
    // A busca ainda no debounce vai para a URL antes de sair, para o "voltar"
    // encontrar a lista como estava.
    const leaveTo = (path: string) => {
        flushSearch();
        navigate(path);
    };
    const newUser = () => leaveTo(NEW_USER_PATH);
    const onlyMe = team.length === 1 && !isFiltered(filters);

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                {/* O <main> é do ClinicLayout. */}
                <div className="px-4 py-6 sm:px-6 sm:py-8">
                    {/* Largura máxima = breakpoint xl do DS (1920px). */}
                    <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6">
                        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="min-w-0 sm:mr-auto">
                                <h1 className="text-ds-body-lg font-medium sm:text-ds-page-title sm:font-normal">
                                    Usuários
                                </h1>
                                <p className="mt-0.5 text-ds-caption text-ds-content-secondary sm:mt-1 sm:text-ds-body-sm">
                                    {isLoading
                                        ? 'Carregando a equipe…'
                                        : isError
                                          ? 'Não foi possível carregar a equipe.'
                                          : teamSummary(team)}
                                </p>
                            </div>
                            <DsButton
                                iconPosition="left"
                                icon={<Plus />}
                                label="Novo usuário"
                                className="max-sm:w-full"
                                onClick={newUser}
                            />
                        </header>

                        <section
                            aria-label="Busca e filtros"
                            className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-xs sm:p-4"
                        >
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="min-w-0 flex-1">
                                    <DsInput
                                        type="search"
                                        aria-label="Pesquisar usuários"
                                        placeholder={
                                            isMobile
                                                ? 'Pesquisar'
                                                : 'Pesquisar por nome ou e-mail'
                                        }
                                        iconLeft={<Search />}
                                        value={searchInput}
                                        onValueChange={setSearchInput}
                                        onCleared={() => setSearchInput('')}
                                    />
                                </div>
                                <div className="hidden items-center gap-3 md:flex">
                                    <UserFiltersBar
                                        filters={filters}
                                        onChange={update}
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
                                        onClick={() => setFiltersOpen(true)}
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
                                                removeUserListChip(
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

                        <DndContext
                            sensors={sensors}
                            onDragEnd={onDragEnd}
                            accessibility={DRAG_ACCESSIBILITY}
                        >
                            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                                <section
                                    aria-labelledby="usuarios-titulo"
                                    className="flex flex-col gap-3"
                                >
                                    <h2
                                        id="usuarios-titulo"
                                        className="flex items-center gap-2 text-ds-body-md font-semibold text-ds-content-primary"
                                    >
                                        Usuários
                                        {loaded && (
                                            <span className="font-ds-mono text-ds-caption font-normal text-ds-content-muted">
                                                {shown.length}
                                            </span>
                                        )}
                                    </h2>
                                    {isLoading ? (
                                        <CardSkeletons />
                                    ) : isError ? (
                                        <DsEmptyState
                                            variant="error"
                                            title="Erro ao carregar a equipe"
                                            description="Tente de novo em alguns instantes."
                                        />
                                    ) : shown.length === 0 ? (
                                        <DsEmptyState
                                            variant="no-results"
                                            title="Ninguém encontrado"
                                            description="Tente ajustar os filtros ou buscar por outro termo."
                                            action={
                                                <DsButton
                                                    variant="secondary"
                                                    label="Limpar busca e filtros"
                                                    onClick={() => clearAll()}
                                                />
                                            }
                                        />
                                    ) : (
                                        <>
                                            <ul
                                                aria-label="Usuários"
                                                className="grid gap-3 xl:grid-cols-2"
                                            >
                                                {shown.map((u) => (
                                                    <li key={u.id}>
                                                        <UserCard
                                                            user={u}
                                                            roleLock={roleLockOf(
                                                                u,
                                                            )}
                                                            onOpen={() =>
                                                                setOpenId(u.id)
                                                            }
                                                            onMove={(to) =>
                                                                requestMove(
                                                                    u,
                                                                    to,
                                                                )
                                                            }
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                            {onlyMe && (
                                                <DsEmptyState
                                                    variant="empty"
                                                    icon={<UserPlus />}
                                                    title="Cadastre a sua equipe"
                                                    description="Convide fisioterapeutas e a recepção para dividir a agenda e os pacientes."
                                                    action={
                                                        <DsButton
                                                            iconPosition="left"
                                                            icon={<Plus />}
                                                            label="Cadastrar o primeiro colega"
                                                            onClick={newUser}
                                                        />
                                                    }
                                                />
                                            )}
                                        </>
                                    )}
                                </section>

                                <RoleAccordion users={loaded ? shown : null} />
                            </div>
                            <UserDragOverlay />
                        </DndContext>
                    </div>
                </div>
            </div>

            <RoleChangeModal
                open={move !== null}
                move={shownMove}
                pending={changeAccess.isPending}
                onConfirm={confirmMove}
                onCancel={() => setMove(null)}
            />

            <UserDrawer
                user={openUser}
                team={team}
                onClose={() => setOpenId(null)}
                onEdit={(u) => leaveTo(`/clinica/usuarios/${u.id}/editar`)}
                onToggleStatus={(u) =>
                    setPendingAction({ user: u, action: statusActionOf(u) })
                }
                onDelete={(u) =>
                    setPendingAction({ user: u, action: 'delete' })
                }
            />

            <UserActionModal
                open={pendingAction !== null}
                user={shownAction?.user ?? null}
                action={shownAction?.action ?? 'deactivate'}
                pending={changeAccess.isPending || deleteUser.isPending}
                onConfirm={confirmAction}
                onCancel={() => setPendingAction(null)}
            />

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
                            disabled={filterCount === 0}
                            onClick={clearFilters}
                        />
                        <div className="ml-auto">
                            <DsButton
                                label={
                                    loaded
                                        ? `Ver ${people(shown.length)}`
                                        : 'Fechar'
                                }
                                onClick={() => setFiltersOpen(false)}
                            />
                        </div>
                    </div>
                }
            >
                <UserFiltersPanel filters={filters} onChange={update} />
            </DsDrawer>
        </ClinicLayout>
    );
}
