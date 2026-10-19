/**
 * PROTÓTIPO (descartável): lista de modelos de evolução no DS v2, na rota
 * real /clinica/templates/evolucoes, trocada por ?variant= (O = v1).
 *
 * A, "Cartões com prévia": cada modelo é um cartão com as seções em
 * miniatura; "Experimentar" abre a gaveta onde se toca nos itens e se vê o
 * texto que vai para o prontuário. O do sistema não se edita: "Duplicar"
 * cria uma cópia da clínica. Os modelos "Exemplo" são fixos no protótipo.
 */
import { Copy, FlaskConical, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
} from '@/components/ds';
import type { EvolutionTemplate } from '@/domain/clinic';
import { PrototypeSwitcher } from '@/pages/clinic/agenda-prototype/PrototypeSwitcher';

import { TryTemplate } from './parts';
import {
    itemCount,
    LIST_VARIANTS,
    sortedSections,
    useTemplateList,
} from './shared';

const toTry = (t: EvolutionTemplate) =>
    sortedSections(t).map((s) => ({
        key: String(s.id),
        title: s.title,
        items: s.items.map((i) => ({
            key: String(i.id),
            label: i.label,
            printText: i.printText,
            hasFreeText: i.hasFreeText,
            placeholder: i.freeTextPlaceholder ?? '',
        })),
    }));

function Card({
    t,
    demo,
    active,
    onToggle,
    onTry,
    onDelete,
}: {
    t: EvolutionTemplate;
    demo: boolean;
    active: boolean;
    onToggle: () => void;
    onTry: () => void;
    onDelete: () => void;
}) {
    const navigate = useNavigate();
    const sections = sortedSections(t);
    return (
        <article className="flex min-w-0 flex-col rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs">
            <div className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                    {t.isSystem && (
                        <DsBadge variant="primary">Do sistema</DsBadge>
                    )}
                    {demo && <DsBadge>Exemplo</DsBadge>}
                    {!active && <DsBadge variant="warning">Inativo</DsBadge>}
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
            {/* Miniatura: as seções com os primeiros itens. */}
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
                {t.isSystem ? (
                    <DsButton
                        size="sm"
                        variant="tertiary"
                        iconPosition="left"
                        icon={<Copy />}
                        label="Duplicar"
                        onClick={() =>
                            toast.info(
                                `Protótipo: "${t.name}" não foi duplicado para a clínica.`,
                            )
                        }
                    />
                ) : (
                    <>
                        <DsButton
                            size="sm"
                            variant="tertiary"
                            iconPosition="left"
                            icon={<Pencil />}
                            label="Editar"
                            onClick={() =>
                                navigate(
                                    `/clinica/templates/evolucoes/${demo ? `exemplo${-t.id}` : t.id}/editar`,
                                )
                            }
                        />
                        <DsButton
                            iconPosition="only"
                            size="sm"
                            variant="destructive-tertiary"
                            icon={<Trash2 />}
                            tooltip="Excluir"
                            onClick={onDelete}
                        />
                    </>
                )}
                {!t.isSystem && (
                    <span className="ml-auto">
                        <DsSwitch
                            label="Ativo"
                            checked={active}
                            onCheckedChange={onToggle}
                        />
                    </span>
                )}
            </footer>
        </article>
    );
}

export default function ListPrototype({ variant }: { variant: string }) {
    const navigate = useNavigate();
    const { loading, all, isDemo } = useTemplateList();
    const [tab, setTab] = useState('todos');
    const [search, setSearch] = useState('');
    const [off, setOff] = useState<Record<number, boolean>>({});
    const [trying, setTrying] = useState<EvolutionTemplate | null>(null);
    const [deleting, setDeleting] = useState<EvolutionTemplate | null>(null);

    const isActive = (t: EvolutionTemplate) => off[t.id] ?? t.isActive;
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

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <div className="mx-auto flex w-full max-w-(--breakpoint-ds-xl) flex-col gap-5 px-4 py-6 lg:px-8">
                    <header className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="text-ds-h4 font-semibold">
                                Modelos de evolução
                            </h1>
                            <p className="text-ds-body-xs text-ds-content-secondary">
                                Itens prontos que viram texto no prontuário com
                                um toque.
                            </p>
                        </div>
                        <DsButton
                            iconPosition="left"
                            icon={<Plus />}
                            label="Novo modelo"
                            onClick={() =>
                                navigate('/clinica/templates/evolucoes/novo')
                            }
                        />
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

                    {loading ? (
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
                                <Card
                                    key={t.id}
                                    t={t}
                                    demo={isDemo(t)}
                                    active={isActive(t)}
                                    onToggle={() => {
                                        setOff({
                                            ...off,
                                            [t.id]: !isActive(t),
                                        });
                                        toast.info(
                                            `Protótipo: "${t.name}" ${isActive(t) ? 'desativado' : 'ativado'} só nesta tela.`,
                                        );
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
                    <TryTemplate key={trying.id} sections={toTry(trying)} />
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
                            onClick={() => {
                                toast.info('Protótipo: nada foi excluído.');
                                setDeleting(null);
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

            <PrototypeSwitcher variants={LIST_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
