import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useInfiniteExercises } from '@/application/clinic';
import {
    useClinicProgram,
    useUpdateClinicProgram,
} from '@/application/clinic/use-programs';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { EditExercisePanel } from '@/components/clinic/program/EditExercisePanel';
import { ProgramWizardNavBar } from '@/components/clinic/program/ProgramWizardNavBar';
import { StepConfigureExercises } from '@/components/clinic/program/StepConfigureExercises';
import { StepProgramDetails } from '@/components/clinic/program/StepProgramDetails';
import { StepSelectExercises } from '@/components/clinic/program/StepSelectExercises';
import type {
    Exercise,
    ProgramExercise,
    ProgramGroup,
    ProgramStep,
} from '@/domain/clinic';

const STEP_LABELS: Record<ProgramStep, string> = {
    1: 'Editar programa',
    2: 'Configurar exercícios',
    3: 'Configurar exercícios',
    4: 'Detalhes do programa',
};

export default function ProgramEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: program, isLoading } = useClinicProgram(id);
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
    const updateProgram = useUpdateClinicProgram();

    const [initialized, setInitialized] = useState(false);
    const [step, setStep] = useState<ProgramStep>(2);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [groups, setGroups] = useState<ProgramGroup[]>([]);
    const [editingExercise, setEditingExercise] = useState<{
        groupId: string;
        exerciseId: string;
    } | null>(null);
    const [targetGroupId, setTargetGroupId] = useState<string | null>(null);

    const [initialTitle, setInitialTitle] = useState('');
    const [initialMessage, setInitialMessage] = useState('');
    const [initialPatientId, setInitialPatientId] = useState<number | null>(
        null,
    );
    const [initialPatientName, setInitialPatientName] = useState('');
    const [initialStartDate, setInitialStartDate] = useState('');
    const [initialEndDate, setInitialEndDate] = useState('');

    useEffect(() => {
        if (!program || initialized) return;
        setInitialized(true);

        setInitialTitle(program.title ?? '');
        setInitialMessage(program.message ?? '');
        setInitialPatientId(
            program.patientId ? Number(program.patientId) : null,
        );
        setInitialPatientName(program.patientName ?? '');
        setInitialStartDate(
            program.startDate ? program.startDate.slice(0, 10) : '',
        );
        setInitialEndDate(program.endDate ? program.endDate.slice(0, 10) : '');

        const mappedGroups: ProgramGroup[] = (program.groups ?? []).map(
            (group) => ({
                id: group.id.toString(),
                name: group.name,
                exercises: group.exercises.map((ex) => ({
                    id: ex.id.toString(),
                    exerciseId: ex.exerciseId.toString(),
                    title: ex.title,
                    thumbnailUrl: ex.thumbnailUrl,
                    videoUrl: ex.videoUrl,
                    days: ex.days ?? [],
                    period: ex.period ?? null,
                    seriesMin: ex.seriesMin ?? null,
                    seriesMax: ex.seriesMax ?? null,
                    repetitionsMin: ex.repetitionsMin ?? null,
                    repetitionsMax: ex.repetitionsMax ?? null,
                    loadMin: ex.loadMin ?? null,
                    loadMax: ex.loadMax ?? null,
                    restTime: ex.restTime ?? null,
                    notes: ex.notes ?? null,
                    isConfigured: true,
                })),
            }),
        );

        setGroups(mappedGroups);
        setSelectedIds(
            mappedGroups.flatMap((g) => g.exercises.map((e) => e.exerciseId)),
        );
    }, [program, initialized]);

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
                    setGroups((prev) =>
                        prev.map((g) => ({
                            ...g,
                            exercises: g.exercises.filter(
                                (e) => e.exerciseId !== exercise.id,
                            ),
                        })),
                    );
                } else {
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
                        ? prev.filter((eid) => eid !== exercise.id)
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
            .map((eid) => exercises.find((ex) => ex.id === eid))
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

        updateProgram.mutate(
            {
                id: id!,
                dto: {
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
                },
            },
            { onSuccess: () => navigate(`/clinica/programas/${id}`) },
        );
    };

    const currentEditExercise =
        editingExercise &&
        groups
            .find((g) => g.id === editingExercise.groupId)
            ?.exercises.find((e) => e.id === editingExercise.exerciseId);

    const configureProgress = useMemo(() => {
        const total = groups.reduce((sum, g) => sum + g.exercises.length, 0);
        const configured = groups.reduce(
            (sum, g) => sum + g.exercises.filter((e) => e.isConfigured).length,
            0,
        );
        return { configured, total };
    }, [groups]);

    const handleWizardBack = () => {
        if (step === 2 && editingExercise) {
            setEditingExercise(null);
            return;
        }
        if (step === 2) {
            setStep(1);
            return;
        }
        if (step === 1) {
            navigate(`/clinica/programas/${id}`);
            return;
        }
        if (step === 4) {
            setStep(2);
        }
    };

    const handleWizardNext = () => {
        if (step === 1) {
            goToStep2();
            return;
        }
        if (step === 2) {
            setEditingExercise(null);
            setStep(4);
        }
    };

    const canAdvanceStep1 =
        groups.length > 0
            ? groups.some((g) => g.exercises.length > 0)
            : selectedIds.length > 0;

    if (isLoading) {
        return (
            <ClinicLayout>
                <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                        Carregando programa...
                    </p>
                </div>
            </ClinicLayout>
        );
    }

    return (
        <ClinicLayout>
            <div className="flex h-full flex-col">
                <ProgramWizardNavBar
                    title={STEP_LABELS[step]}
                    onBack={handleWizardBack}
                    onNext={handleWizardNext}
                    showNext={step === 1 || step === 2}
                    nextDisabled={step === 1 && !canAdvanceStep1}
                    progress={step === 2 ? configureProgress : undefined}
                />

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
                                    onBack={() => {
                                        setEditingExercise(null);
                                        setStep(1);
                                    }}
                                />
                            </div>
                            {currentEditExercise && (
                                <EditExercisePanel
                                    exercise={currentEditExercise}
                                    onSave={handleSaveExercise}
                                    onClose={() => setEditingExercise(null)}
                                />
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <StepProgramDetails
                            groups={groups}
                            initialTitle={initialTitle}
                            initialMessage={initialMessage}
                            initialPatientId={initialPatientId}
                            initialPatientName={initialPatientName}
                            initialStartDate={initialStartDate}
                            initialEndDate={initialEndDate}
                            onSave={handleSaveProgram}
                            isSaving={updateProgram.isPending}
                        />
                    )}
                </div>
            </div>
        </ClinicLayout>
    );
}
