import {
    ArrowLeft,
    Copy,
    FlaskConical,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { can } from '@/application/clinic/permissions';
import {
    useDeleteEvolutionTemplate,
    useEvolutionTemplates,
    useToggleEvolutionTemplateActive,
} from '@/application/clinic/use-evolutions';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    DsBadge,
    DsButton,
    DsDrawer,
    DsEmptyState,
    DsInput,
    DsModal,
    DsSwitch,
    DsTabs,
    DsTooltip,
} from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import type { EvolutionTemplate } from '@/domain/clinic';

import {
    itemCount,
    sortedSections,
    toTrySections,
    TryTemplate,
} from './TryTemplate';

const WRITE_DENIED_REASON =
    'Apenas administradores ou fisioterapeutas podem gerenciar modelos';
const DELETE_DENIED_REASON = 'Apenas administradores podem excluir modelos';

function withReturnTo(path: string, returnTo: string | null): string {
    if (!returnTo) return path;
    return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}

function TemplateCard({
    t,
    canWrite,
    canDelete,
    toggling,
    returnTo,
    onToggleActive,
    onTry,
    onDelete,
}: {
    t: EvolutionTemplate;
    canWrite: boolean;
    canDelete: boolean;
    toggling: boolean;
    returnTo: string | null;
    onToggleActive: () => void;
    onTry: () => void;
    onDelete: () => void;
}) {
    const navigate = useNavigate();
    const sections = sortedSections(t);
    const editPath = withReturnTo(
        `/clinica/templates/evolucoes/${t.id}/editar`,
        returnTo,
    );

    const writeActionButton = t.isSystem ? (
        <DsButton
            size="sm"
            variant="tertiary"
            iconPosition="left"
            icon={<Copy />}
            label="Duplicar"
            aria-disabled={canWrite ? undefined : 'true'}
            onClick={canWrite ? () => navigate(editPath) : undefined}
            className={canWrite ? undefined : 'cursor-not-allowed opacity-50'}
        />
    ) : (
        <DsButton
            size="sm"
            variant="tertiary"
            iconPosition="left"
            icon={<Pencil />}
            label="Editar"
            aria-disabled={canWrite ? undefined : 'true'}
            onClick={canWrite ? () => navigate(editPath) : undefined}
            className={canWrite ? undefined : 'cursor-not-allowed opacity-50'}
        />
    );

    return (
        <article className="flex min-w-0 flex-col rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs">
            <div className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                    {t.isSystem && (
                        <DsBadge variant="primary">Do sistema</DsBadge>
                    )}
                    {!t.isActive && (
                        <DsBadge variant="warning">Inativo</DsBadge>
                    )}
                </div>
                <h2 className="text-ds-body-sm font-semibold">{t.name}</h2>
                {t.description && (
                    <p className="line-clamp-2 text-ds-caption text-ds-content-secondary">
                        {t.description}
                    </p>
                )}
                <p className="font-ds-mono text-ds-caption text-ds-content-muted">
                    {sections.length} seções · {itemCount(t)} itens
                </p>
            </div>

            <button
                type="button"
                onClick={onTry}
                className="mx-4 flex cursor-pointer flex-col gap-2 rounded-ds-lg bg-ds-surface-subtle p-3 text-left"
            >
                {sections.slice(0, 2).map((s) => (
                    <span key={s.id} className="flex min-w-0 flex-col gap-1">
                        <span className="text-ds-micro text-ds-content-muted uppercase">
                            {s.title}
                        </span>
                        <span className="flex flex-wrap gap-1">
                            {s.items.slice(0, 3).map((i) => (
                                <span
                                    key={i.id}
                                    className="max-w-full truncate rounded-ds-pill border border-ds-border-subtle bg-ds-surface-default px-2 py-0.5 text-ds-micro"
                                >
                                    {i.label}
                                </span>
                            ))}
                            {s.items.length > 3 && (
                                <span className="px-1 text-ds-micro text-ds-content-muted">
                                    +{s.items.length - 3}
                                </span>
                            )}
                        </span>
                    </span>
                ))}
                {sections.length > 2 && (
                    <span className="text-ds-micro text-ds-content-muted">
                        e mais {sections.length - 2}{' '}
                        {sections.length - 2 === 1 ? 'seção' : 'seções'}
                    </span>
                )}
            </button>

            <footer className="mt-auto flex flex-wrap items-center gap-2 p-4">
                <DsButton
                    size="sm"
                    variant="secondary"
                    iconPosition="left"
                    icon={<FlaskConical />}
                    label="Experimentar"
                    onClick={onTry}
                />
                {canWrite ? (
                    writeActionButton
                ) : (
                    <DsTooltip content={WRITE_DENIED_REASON} asChild>
                        {writeActionButton}
                    </DsTooltip>
                )}
                {!t.isSystem && (
                    <DsButton
                        iconPosition="only"
                        size="sm"
                        variant="destructive-tertiary"
                        icon={<Trash2 />}
                        label="Excluir"
                        tooltip={canDelete ? 'Excluir' : DELETE_DENIED_REASON}
                        aria-disabled={canDelete ? undefined : 'true'}
                        onClick={canDelete ? onDelete : undefined}
                        className={
                            canDelete
                                ? undefined
                                : 'cursor-not-allowed opacity-50'
                        }
                    />
                )}
                {!t.isSystem && (
                    <span className="ml-auto">
                        {canWrite ? (
                            <DsSwitch
                                label="Ativo"
                                checked={t.isActive}
                                disabled={toggling}
                                onCheckedChange={() => onToggleActive()}
                            />
                        ) : (
                            <DsTooltip content={WRITE_DENIED_REASON} asChild>
                                <span className="inline-flex">
                                    <DsSwitch
                                        label="Ativo"
                                        checked={t.isActive}
                                        aria-disabled="true"
                                        onCheckedChange={() => undefined}
                                    />
                                </span>
                            </DsTooltip>
                        )}
                    </span>
                )}
            </footer>
        </article>
    );
}

export default function EvolutionTemplateListPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo');
    const { user } = useAuth();
    const role = user?.role as ClinicRole | undefined;
    const canWrite = can.manageEvolutionTemplates(role);
    const canDelete = can.delete(role);

    const templatesQuery = useEvolutionTemplates();
    const toggleActive = useToggleEvolutionTemplateActive();
    const deleteTemplate = useDeleteEvolutionTemplate();

    const [tab, setTab] = useState('todos');
    const [search, setSearch] = useState('');
    const [trying, setTrying] = useState<EvolutionTemplate | null>(null);
    const [deleting, setDeleting] = useState<EvolutionTemplate | null>(null);

    const all = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);

    const list = useMemo(() => {
        const q = search.trim().toLowerCase();
        return all.filter(
            (t) =>
                (tab === 'todos' ||
                    (tab === 'sistema' ? t.isSystem : !t.isSystem)) &&
                (!q ||
                    t.name.toLowerCase().includes(q) ||
                    t.sections.some((s) =>
                        s.items.some((i) => i.label.toLowerCase().includes(q)),
                    )),
        );
    }, [all, tab, search]);

    const newPath = withReturnTo('/clinica/templates/evolucoes/novo', returnTo);
    const newButton = (
        <DsButton
            iconPosition="left"
            icon={<Plus />}
            label="Novo modelo"
            aria-disabled={canWrite ? undefined : 'true'}
            onClick={canWrite ? () => navigate(newPath) : undefined}
            className={canWrite ? undefined : 'cursor-not-allowed opacity-50'}
        />
    );

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <div className="mx-auto flex w-full max-w-(--breakpoint-ds-xl) flex-col gap-5 px-4 py-6 lg:px-8">
                    <header className="flex flex-wrap items-end justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            {returnTo && (
                                <button
                                    type="button"
                                    onClick={() => navigate(returnTo)}
                                    className="flex w-fit cursor-pointer items-center gap-1.5 text-ds-body-xs text-ds-content-secondary hover:text-ds-content-brand ds-dark:hover:text-ds-primary-60"
                                >
                                    <ArrowLeft className="size-4" />
                                    Voltar ao prontuário
                                </button>
                            )}
                            <h1 className="text-ds-h4 font-semibold">
                                Modelos de evolução
                            </h1>
                            <p className="text-ds-body-xs text-ds-content-secondary">
                                Itens prontos que viram texto no prontuário com
                                um toque.
                            </p>
                        </div>
                        {canWrite ? (
                            newButton
                        ) : (
                            <DsTooltip content={WRITE_DENIED_REASON} asChild>
                                {newButton}
                            </DsTooltip>
                        )}
                    </header>

                    <div className="flex flex-wrap items-center gap-3">
                        <DsTabs
                            size="sm"
                            value={tab}
                            onValueChange={setTab}
                            tabs={[
                                {
                                    key: 'todos',
                                    label: `Todos (${all.length})`,
                                },
                                {
                                    key: 'clinica',
                                    label: `Da clínica (${all.filter((t) => !t.isSystem).length})`,
                                },
                                {
                                    key: 'sistema',
                                    label: `Do sistema (${all.filter((t) => t.isSystem).length})`,
                                },
                            ]}
                        />
                        <div className="w-full sm:ml-auto sm:w-64">
                            <DsInput
                                size="sm"
                                type="search"
                                aria-label="Procurar modelo ou item"
                                placeholder="Procurar modelo ou item"
                                iconLeft={<Search />}
                                value={search}
                                onValueChange={setSearch}
                                onCleared={() => setSearch('')}
                            />
                        </div>
                    </div>

                    {templatesQuery.isLoading ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="h-72 animate-pulse rounded-ds-xl bg-ds-surface-subtle"
                                />
                            ))}
                        </div>
                    ) : list.length === 0 ? (
                        <DsEmptyState
                            variant="no-results"
                            title="Nenhum modelo encontrado"
                            description="Tente outro nome ou crie um modelo da clínica."
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {list.map((t) => (
                                <TemplateCard
                                    key={t.id}
                                    t={t}
                                    canWrite={canWrite}
                                    canDelete={canDelete}
                                    toggling={toggleActive.isPending}
                                    returnTo={returnTo}
                                    onToggleActive={() => {
                                        void toggleActive.mutateAsync({
                                            id: String(t.id),
                                            isActive: !t.isActive,
                                        });
                                    }}
                                    onTry={() => setTrying(t)}
                                    onDelete={() => setDeleting(t)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <DsDrawer
                open={trying !== null}
                onOpenChange={(o) => !o && setTrying(null)}
                title={trying?.name}
                meta="Toque nos itens como numa evolução"
                size="lg"
            >
                {trying && (
                    <TryTemplate
                        key={trying.id}
                        sections={toTrySections(trying)}
                    />
                )}
            </DsDrawer>

            <DsModal
                open={deleting !== null}
                onOpenChange={(o) => !o && setDeleting(null)}
                title="Excluir modelo"
                size="sm"
                footer={
                    <div className="flex w-full justify-end gap-3">
                        <DsButton
                            variant="secondary"
                            label="Cancelar"
                            onClick={() => setDeleting(null)}
                        />
                        <DsButton
                            variant="destructive"
                            label="Excluir"
                            loading={deleteTemplate.isPending}
                            disabled={deleteTemplate.isPending}
                            onClick={async () => {
                                if (!deleting) return;
                                try {
                                    await deleteTemplate.mutateAsync(
                                        String(deleting.id),
                                    );
                                    setDeleting(null);
                                } catch {
                                    // toast no hook
                                }
                            }}
                        />
                    </div>
                }
            >
                <p className="text-ds-body-sm text-ds-content-secondary">
                    Excluir <strong>“{deleting?.name}”</strong>? As evoluções já
                    escritas com ele continuam no prontuário.
                </p>
            </DsModal>
        </ClinicLayout>
    );
}
