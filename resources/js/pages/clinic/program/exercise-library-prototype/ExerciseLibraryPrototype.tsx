/**
 * PROTÓTIPO (descartável): aba Exercícios (biblioteca) no DS v2, na rota real
 * /clinica/programas/exercicios. ?variant=O mostra a tela v1; D (escolhida)
 * é a v1 puxada para o design system, na casca do Histórico v2. As
 * variantes descartadas (A–C) não foram guardadas.
 *
 * O vídeo toca no cartão, tem tela cheia, e clicar fora desses dois botões
 * abre o modal. Dados reais (até 200 exercícios); busca, filtros e rolagem
 * infinita são locais. Favoritar é real.
 */
import { Plus, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { can } from '@/application/clinic/permissions';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton, dsCn, DsEmptyState, DsTabs } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import { PrototypeSwitcher } from '@/pages/clinic/agenda-prototype/PrototypeSwitcher';

import {
    activeFilterCount,
    applyFilters,
    INITIAL_FILTERS,
    useExerciseLibrary,
    type LibraryFilters,
} from './shared';
import { useIsMobile } from './use-media-query';
import { VariantD } from './VariantD';
import { LIBRARY_VARIANTS } from './variants';

const NEW_PROGRAM_PATH = '/clinica/programas/novo';
const SUBMIT_PATH = '/clinica/exercicios/enviar';

const TABS = [
    { key: 'historico', label: 'Histórico' },
    { key: 'exercicios', label: 'Exercícios' },
    { key: 'programas', label: 'Programas' },
];

const TAB_PATHS: Record<string, string> = {
    historico: '/clinica/programas/historico',
    exercicios: '/clinica/programas/exercicios',
    programas: '/clinica/programas/modelos',
};

function countLabel(n: number, filtered: boolean): string {
    const noun = n === 1 ? 'exercício' : 'exercícios';
    if (filtered)
        return `${n} ${noun} ${n === 1 ? 'encontrado' : 'encontrados'}`;
    return `${n} ${noun} na biblioteca`;
}

export default function ExerciseLibraryPrototype({
    variant,
}: {
    variant: string;
}) {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const canSubmit = can.manageUsers(user?.role as ClinicRole | undefined);

    const [filters, setFilters] = useState<LibraryFilters>(INITIAL_FILTERS);
    const update = (patch: Partial<LibraryFilters>) =>
        setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
    const clearFilters = () =>
        setFilters({
            ...INITIAL_FILTERS,
            search: filters.search,
            perPage: filters.perPage,
        });

    const { exercises, isLoading, isError, toggleFavorite } =
        useExerciseLibrary();
    const filtered = useMemo(
        () => applyFilters(exercises, filters),
        [exercises, filters],
    );
    const isFiltered = filters.search !== '' || activeFilterCount(filters) > 0;

    const emptyState = isError ? (
        <DsEmptyState
            variant="error"
            title="Erro ao carregar exercícios"
            description="Tente de novo em alguns instantes."
        />
    ) : !isLoading && filtered.length === 0 ? (
        <DsEmptyState
            variant={isFiltered ? 'no-results' : 'empty'}
            title={
                isFiltered
                    ? 'Nenhum exercício encontrado'
                    : 'Nenhum exercício na biblioteca'
            }
            description={
                isFiltered
                    ? 'Tente ajustar seus filtros ou buscar por outro termo.'
                    : 'Os exercícios do catálogo e os enviados pela clínica aparecem aqui.'
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

    const tabs = (
        <div className="w-full max-w-md">
            <DsTabs
                aria-label="Seções de programas"
                size={isMobile ? 'sm' : 'md'}
                tabs={TABS}
                value="exercicios"
                onValueChange={(key) => {
                    const path = TAB_PATHS[key];
                    if (path && key !== 'exercicios') navigate(path);
                }}
            />
        </div>
    );
    const createButton = (
        <DsButton
            size={isMobile ? 'full' : 'md'}
            iconPosition="left"
            icon={<Plus />}
            label="Criar programa"
            onClick={() => navigate(NEW_PROGRAM_PATH)}
        />
    );
    const variantNode = (
        <VariantD
            filtered={filtered}
            all={exercises}
            filters={filters}
            onChange={update}
            onClearFilters={clearFilters}
            onToggleFavorite={toggleFavorite}
            isLoading={isLoading}
            emptyState={emptyState}
            canSubmit={canSubmit}
            onSubmit={() => navigate(SUBMIT_PATH)}
            tabs={tabs}
        />
    );

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                {/* Casca do Histórico v2: as abas ficam dentro da caixa de filtros. */}
                <div className="px-4 py-6 sm:px-6 sm:py-8">
                    <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6">
                        {/* No celular, os botões (com texto) descem para uma linha abaixo do título. */}
                        <header className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="min-w-0 sm:mr-auto">
                                <h1 className="text-ds-body-lg font-medium sm:text-ds-page-title sm:font-normal">
                                    Programas e exercícios
                                </h1>
                                <p className="mt-0.5 text-ds-caption text-ds-content-secondary sm:mt-1 sm:text-ds-body-sm">
                                    {isLoading
                                        ? 'Carregando exercícios…'
                                        : countLabel(
                                              filtered.length,
                                              isFiltered,
                                          )}
                                </p>
                            </div>
                            <div
                                className={dsCn(
                                    'grid gap-2 sm:flex sm:gap-3',
                                    canSubmit ? 'grid-cols-2' : 'grid-cols-1',
                                )}
                            >
                                {canSubmit && (
                                    <DsButton
                                        variant="secondary"
                                        size={isMobile ? 'full' : 'md'}
                                        iconPosition="left"
                                        icon={<Upload />}
                                        label="Enviar exercício"
                                        onClick={() => navigate(SUBMIT_PATH)}
                                    />
                                )}
                                {createButton}
                            </div>
                        </header>
                        {variantNode}
                    </div>
                </div>
            </div>
            <PrototypeSwitcher variants={LIBRARY_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
