/**
 * PROTÓTIPO (descartável): tela de usuários no DS v2, na rota real
 * /clinica/usuarios (só administrador, como a v1). ?variant=O mostra a v1;
 * C (a escolhida): os usuários todos juntos de um lado e, do outro, as
 * funções do sistema em sanfona; arrastar alguém para uma função muda a
 * função dela. As variantes A (crachás) e B (quadro do dia) foram
 * descartadas sem commit.
 *
 * Clicar numa pessoa abre o painel dela. Usuários e consultas são reais;
 * editar abre a tela real; o resto que altera dados é stub.
 */
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    DsButton,
    DsCheckbox,
    dsCn,
    DsDrawer,
    DsDropdown,
    DsEmptyState,
    DsFilterChips,
    DsInput,
} from '@/components/ds';
import type { ClinicRole } from '@/domain/auth/session';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';
import { useIsMobile } from '@/pages/clinic/program/exercise-library-prototype/use-media-query';

import {
    applyFilters,
    INITIAL_FILTERS,
    ROLE_META,
    ROLES,
    useTeam,
    type Member,
    type TeamFilters,
} from './data';
import { MemberDrawer } from './parts';
import { VariantC } from './VariantC';
import { USERS_VARIANTS } from './variants';

export interface VariantProps {
    members: Member[];
    isLoading: boolean;
    emptyState: ReactNode;
    onOpen: (m: Member) => void;
}

const STATUS = [
    { key: 'active', label: 'Ativo' },
    { key: 'inactive', label: 'Inativo' },
] as const;

function multiLabel(name: string, selected: string[]): string {
    if (selected.length === 0) return name;
    if (selected.length === 1) return selected[0] as string;
    return `${name} (${selected.length})`;
}

/** "4 pessoas · 4 ativas · 3 sem verificação em duas etapas". */
function summary(all: Member[]): string {
    const active = all.filter((m) => m.active).length;
    const no2fa = all.filter((m) => m.active && !m.twoFactorEnabled).length;
    return [
        `${all.length} ${all.length === 1 ? 'pessoa' : 'pessoas'} na equipe`,
        `${active} ${active === 1 ? 'ativa' : 'ativas'}`,
        no2fa > 0 && `${no2fa} sem verificação em duas etapas`,
    ]
        .filter(Boolean)
        .join(' · ');
}

export default function UserListPrototype({ variant }: { variant: string }) {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { members, isLoading, isError } = useTeam();
    const [filters, setFilters] = useState<TeamFilters>(INITIAL_FILTERS);
    const [drawer, setDrawer] = useState(false);
    const [openId, setOpenId] = useState<string | null>(null);
    const open = members.find((m) => m.id === openId) ?? null;

    const filtered = useMemo(
        () => applyFilters(members, filters),
        [members, filters],
    );
    const update = (patch: Partial<TeamFilters>) =>
        setFilters((prev) => ({ ...prev, ...patch }));
    const filterCount = filters.roles.length + filters.status.length;
    const isFiltered = filters.search !== '' || filterCount > 0;
    const chips = [
        ...filters.roles.map((r) => ({
            key: `role:${r}`,
            label: 'Função',
            value: ROLE_META[r].label,
        })),
        ...filters.status.map((s) => ({
            key: `status:${s}`,
            label: 'Status',
            value: s === 'active' ? 'Ativo' : 'Inativo',
        })),
    ];
    const removeChip = (key: string) => {
        const [kind, value] = key.split(':');
        if (kind === 'role') {
            update({ roles: filters.roles.filter((r) => r !== value) });
        } else {
            update({ status: filters.status.filter((s) => s !== value) });
        }
    };
    const clearFilters = () =>
        setFilters({ ...INITIAL_FILTERS, search: filters.search });

    const emptyState = isError ? (
        <DsEmptyState
            variant="error"
            title="Erro ao carregar a equipe"
            description="Tente de novo em alguns instantes."
        />
    ) : !isLoading && filtered.length === 0 ? (
        <DsEmptyState
            variant={isFiltered ? 'no-results' : 'empty'}
            title={isFiltered ? 'Ninguém encontrado' : 'Nenhum usuário'}
            description={
                isFiltered
                    ? 'Tente ajustar seus filtros ou buscar por outro termo.'
                    : 'Convide a equipe para dividir a agenda e os pacientes.'
            }
            action={
                isFiltered ? (
                    <DsButton
                        variant="secondary"
                        label="Limpar filtros"
                        onClick={() => setFilters(INITIAL_FILTERS)}
                    />
                ) : undefined
            }
        />
    ) : null;

    const roleFilter = (
        <DsDropdown
            mode="checkbox"
            label="Função"
            menuWidth={220}
            fixedLabel={multiLabel(
                'Função',
                filters.roles.map((r) => ROLE_META[r].label),
            )}
            items={ROLES.map((r) => ({ key: r, label: ROLE_META[r].label }))}
            value={filters.roles}
            onValueChange={(v) => update({ roles: v as ClinicRole[] })}
        />
    );
    const statusFilter = (
        <DsDropdown
            mode="checkbox"
            label="Status"
            menuWidth={200}
            menuAlign="right"
            fixedLabel={multiLabel(
                'Status',
                filters.status.map((s) =>
                    s === 'active' ? 'Ativo' : 'Inativo',
                ),
            )}
            items={STATUS.map((s) => ({ key: s.key, label: s.label }))}
            value={filters.status}
            onValueChange={(v) =>
                update({ status: v as TeamFilters['status'] })
            }
        />
    );

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <div className="px-4 py-6 sm:px-6 sm:py-8">
                    <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6">
                        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="min-w-0 sm:mr-auto">
                                <h1 className="text-ds-body-lg font-medium sm:text-ds-page-title sm:font-normal">
                                    Usuários
                                </h1>
                                <p className="mt-0.5 text-ds-caption text-ds-content-secondary sm:mt-1 sm:text-ds-body-sm">
                                    {isLoading
                                        ? 'Carregando a equipe…'
                                        : summary(members)}
                                </p>
                            </div>
                            <DsButton
                                size={isMobile ? 'full' : 'md'}
                                iconPosition="left"
                                icon={<Plus />}
                                label="Novo usuário"
                                onClick={() =>
                                    navigate('/clinica/usuarios/novo')
                                }
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
                                        value={filters.search}
                                        onValueChange={(search) =>
                                            update({ search })
                                        }
                                        onCleared={() => update({ search: '' })}
                                    />
                                </div>
                                <div className="hidden items-center gap-3 md:flex">
                                    {roleFilter}
                                    {statusFilter}
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
                                        onClick={() => setDrawer(true)}
                                    />
                                </div>
                            </div>
                            <div
                                className={dsCn(
                                    'flex min-h-8 items-center',
                                    chips.length === 0 && 'max-sm:hidden',
                                )}
                            >
                                {chips.length > 0 ? (
                                    <DsFilterChips
                                        chips={chips}
                                        onRemove={(c) => removeChip(c.key)}
                                        onClear={clearFilters}
                                    />
                                ) : (
                                    <span className="text-ds-body-compact text-ds-content-muted">
                                        Nenhum filtro aplicado
                                    </span>
                                )}
                            </div>
                        </section>

                        <VariantC
                            members={filtered}
                            isLoading={isLoading}
                            emptyState={emptyState}
                            onOpen={(m) => setOpenId(m.id)}
                        />
                    </div>
                </div>
            </div>

            <DsDrawer
                open={drawer}
                onOpenChange={setDrawer}
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
                                label={`Ver ${filtered.length} ${filtered.length === 1 ? 'pessoa' : 'pessoas'}`}
                                onClick={() => setDrawer(false)}
                            />
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col gap-5">
                    <fieldset className="flex flex-col gap-3 border-b border-ds-border-subtle pb-5">
                        <legend className="mb-3 text-ds-body-sm font-semibold">
                            Função
                        </legend>
                        {ROLES.map((r) => (
                            <DsCheckbox
                                key={r}
                                label={ROLE_META[r].label}
                                checked={filters.roles.includes(r)}
                                onCheckedChange={(on) =>
                                    update({
                                        roles:
                                            on === true
                                                ? [...filters.roles, r]
                                                : filters.roles.filter(
                                                      (x) => x !== r,
                                                  ),
                                    })
                                }
                            />
                        ))}
                    </fieldset>
                    <fieldset className="flex flex-col gap-3">
                        <legend className="mb-3 text-ds-body-sm font-semibold">
                            Status
                        </legend>
                        {STATUS.map((s) => (
                            <DsCheckbox
                                key={s.key}
                                label={s.label}
                                checked={filters.status.includes(s.key)}
                                onCheckedChange={(on) =>
                                    update({
                                        status:
                                            on === true
                                                ? [...filters.status, s.key]
                                                : filters.status.filter(
                                                      (x) => x !== s.key,
                                                  ),
                                    })
                                }
                            />
                        ))}
                    </fieldset>
                </div>
            </DsDrawer>

            <MemberDrawer member={open} onClose={() => setOpenId(null)} />
            <PrototypeSwitcher variants={USERS_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
