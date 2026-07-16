import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import type { ProgramDraft } from '@/application/clinic';
import {
    useCreateClinicProgram,
    useInfiniteExercises,
    useProgramDraft,
} from '@/application/clinic';
import { useUpdateClinicProgram } from '@/application/clinic/use-programs';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { EditExercisePanel } from '@/components/clinic/program/EditExercisePanel';
import { StepConfigureExercises } from '@/components/clinic/program/StepConfigureExercises';
import { StepProgramDetails } from '@/components/clinic/program/StepProgramDetails';
import { StepSelectExercises } from '@/components/clinic/program/StepSelectExercises';
import { Button } from '@/components/ui/button';
import type {
    Exercise,
    ProgramExercise,
    ProgramGroup,
    ProgramStep,
} from '@/domain/clinic';

const NEW_STEP_LABELS: Record<ProgramStep, string> = {
    1: 'Novo programa',
    2: 'Configurar exercícios',
    3: 'Configurar exercícios',
    4: 'Detalhes do programa',
};

const EDIT_STEP_LABELS: Record<ProgramStep, string> = {
    1: 'Editar programa',
    2: 'Configurar exercícios',
    3: 'Configurar exercícios',
    4: 'Detalhes do programa',
};

export default function ProgramNewPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        data: exercisesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingExercises,
    } = useInfiniteExercises();

    const exercises = useMemo(
        () => exercisesData?.pages.flatMap((p) => p.items) ?? [],
        [exercisesData],
    );
    const createProgram = useCreateClinicProgram();
    const updateProgram = useUpdateClinicProgram();

    const editMode: boolean = location.state?.editMode === true;
    const editProgramId: string | undefined = location.state?.programId;
    const initialProgram = location.state?.program;
    const STEP_LABELS = editMode ? EDIT_STEP_LABELS : NEW_STEP_LABELS;

    const [step, setStep] = useState<ProgramStep>(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [groups, setGroups] = useState<ProgramGroup[]>([]);
    const [editingExercise, setEditingExercise] = useState<{
        groupId: string;
        exerciseId: string;
    } | null>(null);

    const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
    const [initialTitle, setInitialTitle] = useState('');
    const [initialMessage, setInitialMessage] = useState('');

    const { draft, hasDraft, scheduleSave, clearDraft, restoreDraft } =
        useProgramDraft(step, selectedIds, groups);

    // Auto-save debounced ao mudar estado do wizard
    useEffect(() => {
        scheduleSave();
    }, [step, selectedIds, groups, scheduleSave]);

    useEffect(() => {
        if (initialProgram && initialProgram.groups) {
            clearDraft(); // cópia de programa tem prioridade sobre rascunho
            setInitialTitle(
                initialProgram.title
                    ? editMode
                        ? initialProgram.title
                        : `${initialProgram.title} (Cópia)`
                    : '',
            );
            setInitialMessage(
                initialProgram.message || initialProgram.description || '',
            );

            const mappedGroups: ProgramGroup[] = initialProgram.groups.map(
                (group: any) => ({
                    id: group.id?.toString() || Math.random().toString(),
                    name: group.name,
                    exercises: (group.exercises || []).map((ex: any) => {
                        const exerciseId =
                            ex.exerciseId?.toString() ||
                            ex.exercise?.id?.toString();
                        return {
                            id: ex.id?.toString() || Math.random().toString(),
                            exerciseId: exerciseId,
                            title: ex.title || ex.exercise?.name || '',
                            thumbnailUrl:
                                ex.thumbnailUrl ||
                                ex.exercise?.thumbnailUrl ||
                                '',
                            videoUrl:
                                ex.videoUrl || ex.exercise?.videoUrl || '',
                            days: ex.days || ex.daysOfWeek || [],
                            period: ex.period || null,
                            seriesMin: ex.seriesMin ?? ex.setsMin ?? null,
                            seriesMax: ex.seriesMax ?? ex.setsMax ?? null,
                            repetitionsMin:
                                ex.repetitionsMin ?? ex.repetitions_min ?? null,
                            repetitionsMax:
                                ex.repetitionsMax ?? ex.repetitions_max ?? null,
                            loadMin: ex.loadMin ?? ex.load_min ?? null,
                            loadMax: ex.loadMax ?? ex.load_max ?? null,
                            restTime: ex.restTime ?? ex.rest_time ?? null,
                            notes: ex.notes ?? null,
                            isConfigured: true,
                        };
                    }),
                }),
            );

            setGroups(mappedGroups);

            const ids = mappedGroups.flatMap((g) =>
                g.exercises.map((e) => e.exerciseId),
            );
            setSelectedIds(ids);

            if (mappedGroups.length > 0) {
                setStep(2);
            }
        }
    }, [initialProgram]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRestoreDraft = (d: ProgramDraft) => {
        setStep(d.step);
        setSelectedIds(d.selectedIds);
        setGroups(d.groups);
    };

    // When groups exist, derive selectedIds from groups
    const effectiveSelectedIds = useMemo(() => {
        if (groups.length === 0) return selectedIds;
        return [
            ...new Set(
                groups.flatMap((g) => g.exercises.map((e) => e.exerciseId)),
            ),
        ];
    }, [groups, selectedIds]);

    const toggleSelect = useCallback(
        (exercise: Exercise) => {
            if (groups.length > 0) {
                const isSelected = groups.some((g) =>
                    g.exercises.some((e) => e.exerciseId === exercise.id),
                );
                if (isSelected) {
                    // Remove from all groups
                    setGroups((prev) =>
                        prev.map((g) => ({
                            ...g,
                            exercises: g.exercises.filter(
                                (e) => e.exerciseId !== exercise.id,
                            ),
                        })),
                    );
                } else {
                    // Add to target group or first group
                    const tId =
                        targetGroupId &&
                        groups.some((g) => g.id === targetGroupId)
                            ? targetGroupId
                            : groups[0]?.id;
                    if (!tId) return;
                    const newEx: ProgramExercise = {
                        id: `${exercise.id}-${Date.now()}`,
                        exerciseId: exercise.id,
                        title: exercise.title,
                        thumbnailUrl: exercise.thumbnailUrl,
                        videoUrl: exercise.videoUrl,
                        days: [],
                        period: null,
                        seriesMin: null,
                        seriesMax: null,
                        repetitionsMin: null,
                        repetitionsMax: null,
                        loadMin: null,
                        loadMax: null,
                        restTime: null,
                        notes: null,
                        isConfigured: false,
                    };
                    setGroups((prev) =>
                        prev.map((g) =>
                            g.id === tId
                                ? { ...g, exercises: [...g.exercises, newEx] }
                                : g,
                        ),
                    );
                }
            } else {
                setSelectedIds((prev) =>
                    prev.includes(exercise.id)
                        ? prev.filter((id) => id !== exercise.id)
                        : [...prev, exercise.id],
                );
            }
        },
        [groups, targetGroupId],
    );

    const removeSelected = useCallback((id: string) => {
        setSelectedIds((prev) => prev.filter((eid) => eid !== id));
    }, []);

    const removeFromGroup = useCallback(
        (groupId: string, exerciseId: string) => {
            setGroups((prev) =>
                prev.map((g) =>
                    g.id === groupId
                        ? {
                              ...g,
                              exercises: g.exercises.filter(
                                  (e) => e.id !== exerciseId,
                              ),
                          }
                        : g,
                ),
            );
        },
        [],
    );

    const goToStep2 = () => {
        const programExercises: ProgramExercise[] = selectedIds
            .map((id) => exercises.find((ex) => ex.id === id))
            .filter(Boolean)
            .map((ex) => ({
                id: ex!.id,
                exerciseId: ex!.id,
                title: ex!.title,
                thumbnailUrl: ex!.thumbnailUrl,
                videoUrl: ex!.videoUrl,
                days: [],
                period: null,
                seriesMin: null,
                seriesMax: null,
                repetitionsMin: null,
                repetitionsMax: null,
                loadMin: null,
                loadMax: null,
                restTime: null,
                notes: null,
                isConfigured: false,
            }));

        if (groups.length === 0) {
            setGroups([
                {
                    id: 'group-1',
                    name: 'Novo grupo',
                    exercises: programExercises,
                },
            ]);
        }
        setStep(2);
    };

    const handleEditExercise = (groupId: string, exerciseId: string) => {
        setEditingExercise({ groupId, exerciseId });
    };

    const handleSaveExercise = (updated: ProgramExercise) => {
        setGroups((prev) =>
            prev.map((g) =>
                g.id === editingExercise?.groupId
                    ? {
                          ...g,
                          exercises: g.exercises.map((e) =>
                              e.id === updated.id ? updated : e,
                          ),
                      }
                    : g,
            ),
        );
        setEditingExercise(null);
    };

    const handleSaveProgram = (details: {
        title: string;
        patientId: number | null;
        patientName: string;
        startDate: string;
        endDate: string;
        message: string;
    }) => {
        const groupsPayload = groups.map((g, i) => ({
            name: g.name,
            sortOrder: i,
        }));
        const periodMap = {
            manha: 'morning',
            tarde: 'afternoon',
            noite: 'night',
        } as const;
        const exercisesPayload = groups.flatMap((g, groupIndex) =>
            g.exercises.map((e) => ({
                exerciseId: Number(e.exerciseId),
                groupIndex,
                days: e.days,
                period: e.period ? periodMap[e.period] : null,
                setsMin: e.seriesMin,
                setsMax: e.seriesMax,
                repetitionsMin: e.repetitionsMin ?? null,
                repetitionsMax: e.repetitionsMax ?? null,
                loadMin: e.loadMin ?? null,
                loadMax: e.loadMax ?? null,
                restTime: e.restTime ?? null,
                notes: e.notes ?? null,
            })),
        );

        const dto = {
            title: details.title,
            patientId: details.patientId,
            message: details.message,
            startDate: details.startDate || null,
            endDate: details.endDate || null,
            status: (details.patientId ? 'active' : 'draft') as
                | 'active'
                | 'draft',
            groups: groupsPayload,
            exercises: exercisesPayload,
        };

        if (editMode && editProgramId) {
            updateProgram.mutate(
                { id: editProgramId, dto },
                {
                    onSuccess: () => {
                        navigate(`/clinica/programas/${editProgramId}`);
                    },
                },
            );
        } else {
            createProgram.mutate(dto, {
                onSuccess: () => {
                    clearDraft();
                    navigate('/clinica/programas');
                },
            });
        }
    };

    const currentEditExercise =
        editingExercise &&
        groups
            .find((g) => g.id === editingExercise.groupId)
            ?.exercises.find((e) => e.id === editingExercise.exerciseId);

    return (
        <ClinicLayout>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (step === 1) {
                                        navigate('/clinica/programas');
                                        return;
                                    }
                                    if (step === 2 && editingExercise) {
                                        setEditingExercise(null);
                                        return;
                                    }
                                    if (step === 2) {
                                        setStep(1);
                                        return;
                                    }
                                    if (step === 4) {
                                        setStep(2);
                                    }
                                }}
                                className="cursor-pointer gap-1 text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Voltar
                            </Button>
                        </div>
                        <h1 className="mt-2 text-lg font-semibold text-foreground sm:text-xl">
                            {STEP_LABELS[step]}
                        </h1>
                    </div>
                </header>

                {hasDraft && draft && (
                    <div className="flex flex-col gap-2 border-b border-border bg-muted px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <span className="text-muted-foreground">
                            Rascunho salvo às{' '}
                            {new Date(draft.savedAt).toLocaleTimeString(
                                'pt-BR',
                                {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                },
                            )}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer"
                                onClick={() => {
                                    const d = restoreDraft();
                                    if (d) handleRestoreDraft(d);
                                }}
                            >
                                Restaurar
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer"
                                onClick={clearDraft}
                            >
                                Descartar
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex flex-1 overflow-hidden">
                    {step === 1 && (
                        <StepSelectExercises
                            exercises={exercises}
                            selectedIds={effectiveSelectedIds}
                            groups={groups}
                            targetGroupId={targetGroupId}
                            onToggleSelect={toggleSelect}
                            onRemove={removeSelected}
                            onRemoveFromGroup={removeFromGroup}
                            onSetTargetGroup={setTargetGroupId}
                            onNext={goToStep2}
                            fetchNextPage={fetchNextPage}
                            hasNextPage={hasNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                            isLoading={isLoadingExercises}
                        />
                    )}

                    {step === 2 && (
                        <div className="flex min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                                <StepConfigureExercises
                                    groups={groups}
                                    onUpdateGroups={setGroups}
                                    onEditExercise={handleEditExercise}
                                    onNext={() => {
                                        setEditingExercise(null);
                                        setStep(4);
                                    }}
                                    onBack={() => {
                                        setEditingExercise(null);
                                        setStep(1);
                                    }}
                                />
                            </div>
                            {step === 2 && currentEditExercise && (
                                <EditExercisePanel
                                    exercise={currentEditExercise}
                                    onSave={handleSaveExercise}
                                    onClose={() => setEditingExercise(null)}
                                />
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                            <StepProgramDetails
                                groups={groups}
                                initialTitle={initialTitle}
                                initialMessage={initialMessage}
                                onBack={() => setStep(2)}
                                onSave={handleSaveProgram}
                                isSaving={
                                    createProgram.isPending ||
                                    updateProgram.isPending
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </ClinicLayout>
    );
}
