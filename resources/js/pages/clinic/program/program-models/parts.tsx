import {
    CalendarDays,
    Copy,
    MessageSquareText,
    Pencil,
    Stethoscope,
    Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { can } from '@/application/clinic/permissions';
import {
    useDeleteClinicProgram,
    useDuplicateClinicProgram,
} from '@/application/clinic/use-programs';
import {
    DsActionsMenu,
    DsButton,
    DsCheckbox,
    DsDropdown,
    DsModal,
} from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import { CardVideo } from '@/pages/clinic/program/exercise-library/media';

import {
    areaOptions,
    doseOf,
    scheduleOf,
    useFetchModelDetail,
    type ModelExercise,
    type ModelFilters,
    type ModelGroup,
    type ModelSummary,
} from './data';

export const NEW_PROGRAM_PATH = '/clinica/programas/novo';

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
    const fetchDetail = useFetchModelDetail();
    const { mutate: duplicate } = useDuplicateClinicProgram();
    const { mutate: deleteProgram } = useDeleteClinicProgram();
    const [toDelete, setToDelete] = useState<ModelSummary | null>(null);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const openWizard = async (
        model: ModelSummary,
        state: Record<string, unknown>,
    ) => {
        try {
            const detail = await fetchDetail(model);
            if (!detail) throw new Error('Modelo não encontrado.');
            if (!mounted.current) return;
            navigate(NEW_PROGRAM_PATH, {
                state: { ...state, program: detail.source },
            });
        } catch {
            toast.error('Não foi possível abrir o modelo. Tente novamente.');
        }
    };

    const run = (key: ModelActionKey, model: ModelSummary) => {
        if (key === 'edit') {
            void openWizard(model, {
                editMode: true,
                asModel: true,
                programId: model.id,
            });
            return;
        }
        if (key === 'duplicate') {
            duplicate(model.id);
            return;
        }
        if (key === 'delete') {
            setToDelete(model);
        }
    };

    const deleteModal = (
        <DsModal
            open={toDelete !== null}
            onOpenChange={(open) => !open && setToDelete(null)}
            title="Excluir modelo"
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
                            if (toDelete) deleteProgram(toDelete.id);
                            setToDelete(null);
                        }}
                    />
                </div>
            }
        >
            <p className="text-ds-body-sm text-ds-content-secondary">
                Excluir <strong>“{toDelete?.title}”</strong>? Esta ação não pode
                ser desfeita.
            </p>
        </DsModal>
    );

    return {
        use: (model: ModelSummary) => openWizard(model, {}),
        run,
        deleteModal,
    };
}

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
    const { use } = useModelActions();
    const [loading, setLoading] = useState(false);
    return (
        <DsButton
            size={size}
            variant={variant}
            label={label}
            loading={loading}
            onClick={async (ev) => {
                ev.stopPropagation();
                setLoading(true);
                await use(model);
                setLoading(false);
            }}
        />
    );
}

export function ModelActionsMenu({
    model,
    onAction,
}: {
    model: ModelSummary;
    onAction: (key: ModelActionKey, model: ModelSummary) => void;
}) {
    const { user } = useAuth();
    const canDelete = can.delete(user?.role as ClinicRole | undefined);
    if (model.origin !== 'meus') return null;
    return (
        <div onClick={(ev) => ev.stopPropagation()}>
            <DsActionsMenu
                label={`Mais ações de ${model.title}`}
                items={MODEL_ACTIONS.map((a) =>
                    a.key === 'delete'
                        ? {
                              ...a,
                              disabled: !canDelete,
                              disabledReason:
                                  'Só o admin da clínica pode excluir.',
                          }
                        : a,
                )}
                onSelect={(key) => onAction(key as ModelActionKey, model)}
            />
        </div>
    );
}

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
