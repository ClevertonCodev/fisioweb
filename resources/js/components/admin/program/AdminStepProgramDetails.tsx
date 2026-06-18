import { useMemo, useState } from 'react';

import { useAdminExerciseOptions } from '@/application/admin';
import type {
    AdminProgramExerciseWriteDto,
    AdminProgramGroupWriteDto,
    AdminProgramWriteDto,
} from '@/application/admin/ports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SelectOption } from '@/components/ui/select-options';
import { SelectOptions } from '@/components/ui/select-options';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import type { AdminWizardGroup } from './types';

interface AdminStepProgramDetailsProps {
    groups: AdminWizardGroup[];
    onBack: () => void;
    onSave: (dto: AdminProgramWriteDto) => void;
    isSaving?: boolean;
    initialValues?: {
        title?: string;
        description?: string | null;
        physioAreaId?: number | null;
        physioSubareaId?: number | null;
        durationMinutes?: number | null;
        isActive?: boolean;
    };
}

export function AdminStepProgramDetails({
    groups,
    onBack,
    onSave,
    isSaving,
    initialValues,
}: AdminStepProgramDetailsProps) {
    const [title, setTitle] = useState(initialValues?.title ?? '');
    const [description, setDescription] = useState(
        initialValues?.description ?? '',
    );
    const [physioAreaId, setPhysioAreaId] = useState<number | null>(
        initialValues?.physioAreaId ?? null,
    );
    const [physioSubareaId, setPhysioSubareaId] = useState<number | null>(
        initialValues?.physioSubareaId ?? null,
    );
    const [durationMinutes, setDurationMinutes] = useState<string>(
        initialValues?.durationMinutes?.toString() ?? '',
    );
    const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);

    const { data: options } = useAdminExerciseOptions();

    const subareas = useMemo(() => {
        if (!physioAreaId || !options) return [];
        const area = options.physio_areas.find((a) => a.id === physioAreaId);
        return area?.subareas ?? [];
    }, [physioAreaId, options]);

    const totalExercises = groups.reduce((s, g) => s + g.exercises.length, 0);

    const thumbnails = groups
        .flatMap((g) => g.exercises)
        .slice(0, 3)
        .map((e) => e.thumbnailUrl);
    const remaining = totalExercises - thumbnails.length;

    const handleSubmit = () => {
        if (!title.trim()) return;

        const groupDtos: AdminProgramGroupWriteDto[] = groups.map((g, gi) => ({
            name: g.name,
            sortOrder: gi,
        }));

        const exerciseDtos: AdminProgramExerciseWriteDto[] = groups.flatMap(
            (g, gi) =>
                g.exercises.map((e, ei) => ({
                    exerciseId: e.exerciseId,
                    groupIndex: gi,
                    daysOfWeek: e.days.length > 0 ? e.days : null,
                    period: e.period,
                    setsMin: e.setsMin,
                    setsMax: e.setsMax,
                    repetitionsMin: e.repetitionsMin,
                    repetitionsMax: e.repetitionsMax,
                    loadMin: e.loadMin,
                    loadMax: e.loadMax,
                    restTime: e.restTime,
                    notes: e.notes,
                    sortOrder: ei,
                })),
        );

        onSave({
            title: title.trim(),
            description: description.trim() || null,
            physioAreaId,
            physioSubareaId,
            durationMinutes: durationMinutes ? Number(durationMinutes) : null,
            isActive,
            groups: groupDtos,
            exercises: exerciseDtos,
        });
    };

    return (
        <div className="flex min-h-0 min-w-0 flex-1">
            {/* Form */}
            <ScrollArea className="flex-1">
                <div className="space-y-4 p-8">
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Título{' '}
                                <span className="text-destructive">*</span>
                            </label>
                            <Input
                                placeholder="Nome do programa template"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Descrição
                            </label>
                            <Textarea
                                placeholder="Descrição do programa (opcional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                    Área
                                </label>
                                <SelectOptions
                                    value={(() => {
                                        const a =
                                            physioAreaId && options
                                                ? options.physio_areas.find(
                                                      (x) =>
                                                          x.id === physioAreaId,
                                                  )
                                                : undefined;
                                        return a
                                            ? {
                                                  label: a.name,
                                                  value: a.id.toString(),
                                              }
                                            : null;
                                    })()}
                                    onChange={(opt: SelectOption | null) => {
                                        setPhysioAreaId(
                                            opt ? Number(opt.value) : null,
                                        );
                                        setPhysioSubareaId(null);
                                    }}
                                    options={(options?.physio_areas ?? []).map(
                                        (a) => ({
                                            label: a.name,
                                            value: a.id.toString(),
                                        }),
                                    )}
                                    placeholder="Selecionar área"
                                />
                            </div>

                            <div className="flex-1">
                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                    Subárea
                                </label>
                                <SelectOptions
                                    value={(() => {
                                        const s = physioSubareaId
                                            ? subareas.find(
                                                  (x) =>
                                                      x.id === physioSubareaId,
                                              )
                                            : undefined;
                                        return s
                                            ? {
                                                  label: s.name,
                                                  value: s.id.toString(),
                                              }
                                            : null;
                                    })()}
                                    onChange={(opt: SelectOption | null) =>
                                        setPhysioSubareaId(
                                            opt ? Number(opt.value) : null,
                                        )
                                    }
                                    options={subareas.map((s) => ({
                                        label: s.name,
                                        value: s.id.toString(),
                                    }))}
                                    placeholder="Selecionar subárea"
                                    disabled={subareas.length === 0}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Duração estimada (minutos)
                            </label>
                            <Input
                                type="number"
                                min={1}
                                placeholder="Ex: 45"
                                value={durationMinutes}
                                onChange={(e) =>
                                    setDurationMinutes(e.target.value)
                                }
                                className="max-w-xs"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch
                                id="is-active"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                            <label
                                htmlFor="is-active"
                                className="cursor-pointer text-sm text-foreground"
                            >
                                Programa ativo
                            </label>
                        </div>
                    </div>
                </div>
            </ScrollArea>

            {/* Right - summary */}
            <div className="flex flex-1 flex-col border-l border-border bg-card">
                <div className="space-y-4 p-6">
                    <h3 className="text-base font-semibold text-foreground">
                        Resumo do programa
                    </h3>

                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {thumbnails.map((url, i) => (
                                <div
                                    key={i}
                                    className="h-10 w-10 overflow-hidden rounded-full border-2 border-card bg-muted"
                                >
                                    {url && (
                                        <img
                                            src={url}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                </div>
                            ))}
                            {remaining > 0 && (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
                                    +{remaining}
                                </div>
                            )}
                        </div>
                        <span className="ml-2 text-sm text-foreground">
                            {totalExercises} exercício
                            {totalExercises !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Grupos
                            </span>
                            <span className="text-foreground">
                                {groups.length}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Exercícios
                            </span>
                            <span className="text-foreground">
                                {totalExercises}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto border-t border-border p-4">
                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={!title.trim() || isSaving}
                    >
                        {isSaving ? 'Salvando...' : 'Salvar programa'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
