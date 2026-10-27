/**
 * PROTÓTIPO (descartável): peças comuns às variantes da aba Programas.
 * "Usar modelo" é real (abre o assistente com o modelo, como a v1);
 * editar, duplicar e excluir um modelo da clínica são stub.
 */
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    CalendarDays,
    Copy,
    MessageSquareText,
    MoreHorizontal,
    Pencil,
    Stethoscope,
    Trash2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
    DsButton,
    DsCheckbox,
    dsCn,
    DsDropdown,
    DsTooltip,
} from '@/components/ds';
import { CardVideo } from '@/pages/clinic/program/exercise-library-prototype/media';

import {
    areaOptions,
    doseOf,
    scheduleOf,
    useModelDetail,
    type ModelDetail,
    type ModelExercise,
    type ModelFilters,
    type ModelGroup,
    type ModelSummary,
} from './data';

export const NEW_PROGRAM_PATH = '/clinica/programas/novo';

// ---------------------------------------------------------------- exercícios

/** Dose em pedaços: o número forte e a unidade apagada. */
export function DoseLine({ exercise }: { exercise: ModelExercise }) {
    const dose = doseOf(exercise);
    if (dose.length === 0) {
        return (
            <p className="text-ds-caption text-ds-content-muted">
                Sem dose definida
            </p>
        );
    }
    return (
        <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-ds-caption">
            {dose.map((d) => (
                <span key={d.key} className="whitespace-nowrap">
                    <span className="font-semibold text-ds-content-primary">
                        {d.value}
                    </span>{' '}
                    <span className="text-ds-content-secondary">{d.unit}</span>
                </span>
            ))}
        </p>
    );
}

export function ExerciseRow({ exercise: e }: { exercise: ModelExercise }) {
    const schedule = scheduleOf(e);
    return (
        <li className="flex gap-3 py-3 sm:gap-4">
            <CardVideo
                exercise={e}
                className="size-20 shrink-0 rounded-ds-lg sm:size-24"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
                <p className="line-clamp-2 text-ds-body-sm font-medium text-ds-content-primary">
                    {e.title}
                </p>
                <DoseLine exercise={e} />
                {schedule && (
                    <p className="flex items-center gap-1.5 text-ds-caption text-ds-content-muted [&_svg]:size-3.5">
                        <CalendarDays />
                        {schedule}
                    </p>
                )}
                {e.notes && (
                    <p className="flex items-start gap-1.5 text-ds-caption text-ds-content-secondary [&_svg]:mt-0.5 [&_svg]:size-3.5 [&_svg]:shrink-0">
                        <MessageSquareText />
                        <span className="line-clamp-2">{e.notes}</span>
                    </p>
                )}
            </div>
        </li>
    );
}

export function GroupSections({ groups }: { groups: ModelGroup[] }) {
    if (groups.length === 0) {
        return (
            <p className="text-ds-body-sm text-ds-content-muted">
                Este modelo ainda não tem exercícios.
            </p>
        );
    }
    return (
        <div className="flex flex-col gap-6">
            {groups.map((g) => (
                <section key={g.id} aria-label={g.name}>
                    <header className="flex items-center gap-2 border-b border-ds-border-subtle pb-2">
                        <h3 className="text-ds-body-sm font-semibold text-ds-content-primary">
                            {g.name || 'Sem nome'}
                        </h3>
                        <span className="rounded-ds-full bg-ds-surface-subtle px-2 font-ds-mono text-ds-caption text-ds-content-secondary">
                            {g.exercises.length}
                        </span>
                    </header>
                    {g.exercises.length > 0 ? (
                        <ul className="divide-y divide-ds-border-subtle">
                            {g.exercises.map((e) => (
                                <ExerciseRow key={e.id} exercise={e} />
                            ))}
                        </ul>
                    ) : (
                        <p className="py-3 text-ds-caption text-ds-content-muted">
                            Nenhum exercício neste grupo
                        </p>
                    )}
                </section>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------- ações

export type ModelActionKey = 'edit' | 'duplicate' | 'delete';

const MODEL_ACTIONS: {
    key: ModelActionKey;
    label: string;
    icon: ReactNode;
    danger?: boolean;
}[] = [
    { key: 'edit', label: 'Editar modelo', icon: <Pencil /> },
    { key: 'duplicate', label: 'Duplicar', icon: <Copy /> },
    { key: 'delete', label: 'Excluir modelo', icon: <Trash2 />, danger: true },
];

export function useModelActions() {
    const navigate = useNavigate();
    return {
        /** Real: o mesmo que o "Criar programa" do detalhe na v1. */
        use: (detail: ModelDetail) =>
            navigate(NEW_PROGRAM_PATH, { state: { program: detail.source } }),
        run: (key: ModelActionKey, model: ModelSummary) => {
            const verb = {
                edit: 'não foi aberto para edição',
                duplicate: 'não foi duplicado',
                delete: 'não foi excluído',
            }[key];
            toast.info(`Protótipo: "${model.title}" ${verb}.`);
        },
    };
}

/** "Usar modelo": espera o detalhe (grupos) para abrir o assistente. */
export function UseModelButton({
    model,
    size = 'md',
    variant = 'primary',
    label = 'Usar modelo',
}: {
    model: ModelSummary;
    size?: 'sm' | 'md' | 'full';
    variant?: 'primary' | 'secondary';
    label?: string;
}) {
    const { detail, isLoading } = useModelDetail(model);
    const { use } = useModelActions();
    return (
        <DsButton
            size={size}
            variant={variant}
            label={label}
            loading={isLoading}
            disabled={!detail}
            onClick={(ev) => {
                ev.stopPropagation();
                if (detail) use(detail);
            }}
        />
    );
}

const menuItem =
    'flex w-full cursor-pointer items-center gap-2 rounded-ds-md px-3 py-[9px] text-left font-ds text-ds-body-xs font-medium whitespace-nowrap outline-none transition-[background] duration-100 data-[highlighted]:bg-ds-surface-subtle [&_svg]:size-4';

/** "…" com editar/duplicar/excluir; só os modelos da clínica têm. */
export function ModelActionsMenu({ model }: { model: ModelSummary }) {
    const { run } = useModelActions();
    if (model.origin !== 'meus') return null;
    return (
        <DropdownMenu.Root modal={false}>
            <DsTooltip content="Mais ações" asChild>
                <DropdownMenu.Trigger asChild>
                    <button
                        type="button"
                        aria-label={`Mais ações de ${model.title}`}
                        onClick={(ev) => ev.stopPropagation()}
                        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-ds-md text-ds-content-secondary transition-colors hover:bg-ds-surface-brand-subtle hover:text-ds-content-brand focus-visible:shadow-ds-focus focus-visible:outline-0 data-[state=open]:bg-ds-surface-brand-subtle ds-dark:hover:text-ds-primary-60 [&_svg]:size-4"
                    >
                        <MoreHorizontal />
                    </button>
                </DropdownMenu.Trigger>
            </DsTooltip>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    collisionPadding={8}
                    onClick={(ev) => ev.stopPropagation()}
                    className="z-[9999] min-w-48 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-1 font-ds shadow-ds-md"
                >
                    {MODEL_ACTIONS.map((a) => (
                        <DropdownMenu.Item
                            key={a.key}
                            onSelect={() => run(a.key, model)}
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

function multiLabel(name: string, selected: string[]): string {
    if (selected.length === 0) return name;
    if (selected.length === 1) return selected[0] as string;
    return `${name} (${selected.length})`;
}

interface FiltersProps {
    models: ModelSummary[];
    filters: ModelFilters;
    onChange: (patch: Partial<ModelFilters>) => void;
}

export function ModelFiltersBar({ models, filters, onChange }: FiltersProps) {
    const areas = areaOptions(models);
    if (areas.length === 0) return null;
    return (
        <DsDropdown
            mode="checkbox"
            label="Especialidade"
            icon={<Stethoscope />}
            menuWidth={240}
            menuAlign="right"
            fixedLabel={multiLabel('Especialidade', filters.areas)}
            items={areas.map((a) => ({ key: a, label: a }))}
            value={filters.areas}
            onValueChange={(v) => onChange({ areas: v as string[] })}
        />
    );
}

export function ModelFiltersPanel({ models, filters, onChange }: FiltersProps) {
    const areas = areaOptions(models);
    return (
        <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-ds-body-sm font-semibold text-ds-content-primary">
                Especialidade
            </legend>
            {areas.map((a) => (
                <DsCheckbox
                    key={a}
                    label={`${a} (${models.filter((m) => m.area === a).length})`}
                    checked={filters.areas.includes(a)}
                    onCheckedChange={(on) =>
                        onChange({
                            areas:
                                on === true
                                    ? [...filters.areas, a]
                                    : filters.areas.filter((x) => x !== a),
                        })
                    }
                />
            ))}
        </fieldset>
    );
}
