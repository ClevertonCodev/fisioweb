import { useCallback, useState } from 'react';
import { useLoaderData, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useAdminExercises, useUpdateAdminProgram } from '@/application/admin';
import type {
    AdminExercise,
    AdminProgramWriteDto,
} from '@/application/admin/ports';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminEditExercisePanel } from '@/components/admin/program/AdminEditExercisePanel';
import { AdminStepConfigureExercises } from '@/components/admin/program/AdminStepConfigureExercises';
import { AdminStepProgramDetails } from '@/components/admin/program/AdminStepProgramDetails';
import { AdminStepSelectExercises } from '@/components/admin/program/AdminStepSelectExercises';
import type {
    AdminWizardExercise,
    AdminWizardGroup,
} from '@/components/admin/program/types';
import { BackButton } from '@/components/ui/back-button';
import type { AdminProgram } from '@/domain/admin';

type WizardStep = 1 | 2 | 3;

const STEP_LABELS: Record<WizardStep, string> = {
    1: 'Editar programa',
    2: 'Configurar exercícios',
    3: 'Detalhes do programa',
};

function programToWizardGroups(program: AdminProgram): AdminWizardGroup[] {
    if (!program.groups || program.groups.length === 0) return [];
    return program.groups.map((g) => ({
        id: g.id,
        name: g.name,
        exercises: (g.exercises ?? []).map((ex) => ({
            id: ex.id,
            exerciseId: ex.exerciseId,
            name: ex.exercise?.name ?? `Exercício ${ex.exerciseId}`,
            thumbnailUrl: ex.exercise?.thumbnailUrl ?? null,
            videoUrl: ex.exercise?.videoUrl ?? null,
            days: ex.daysOfWeek ?? [],
            period: ex.period,
            setsMin: ex.setsMin,
            setsMax: ex.setsMax,
            repetitionsMin: ex.repetitionsMin,
            repetitionsMax: ex.repetitionsMax,
            loadMin: ex.loadMin,
            loadMax: ex.loadMax,
            restTime: ex.restTime,
            notes: ex.notes ?? '',
            isConfigured: !!(
                ex.setsMin ||
                ex.repetitionsMin ||
                (ex.daysOfWeek?.length ?? 0) > 0
            ),
        })),
    }));
}

export default function ProgramEditPage() {
    const { id } = useParams<{ id: string }>();
    const programId = Number(id);
    const navigate = useNavigate();
    const program = useLoaderData() as AdminProgram;

    const [step, setStep] = useState<WizardStep>(1);
    const [selectedIds, setSelectedIds] = useState<number[]>(() =>
        (program.groups ?? []).flatMap((g) =>
            (g.exercises ?? []).map((e) => e.exerciseId),
        ),
    );
    const [groups, setGroups] = useState<AdminWizardGroup[]>(() =>
        programToWizardGroups(program),
    );
    const [editingExercise, setEditingExercise] = useState<{
        groupId: number;
        exerciseId: number;
    } | null>(null);

    const { data: exercisesResult, isLoading: isLoadingExercises } =
        useAdminExercises({
            per_page: 200,
        });
    const exercises = Array.isArray(exercisesResult)
        ? exercisesResult
        : ((exercisesResult as { data?: AdminExercise[] } | undefined)?.data ??
          []);

    const updateMutation = useUpdateAdminProgram(programId, {
        onSuccess: () => {
            toast.success('Programa atualizado com sucesso!');
            navigate(`/admin/programas/${programId}`);
        },
    });

    const toggleSelect = useCallback((exercise: AdminExercise) => {
        setSelectedIds((prev) =>
            prev.includes(exercise.id)
                ? prev.filter((id) => id !== exercise.id)
                : [...prev, exercise.id],
        );
    }, []);

    const removeSelected = useCallback((id: number) => {
        setSelectedIds((prev) => prev.filter((eid) => eid !== id));
    }, []);

    const goToStep2 = () => {
        // Find exercises not yet in groups
        const existingExerciseIds = groups.flatMap((g) =>
            g.exercises.map((e) => e.exerciseId),
        );
        const newExercises: AdminWizardExercise[] = selectedIds
            .filter((id) => !existingExerciseIds.includes(id))
            .map((id) => exercises.find((ex) => ex.id === id))
            .filter((ex): ex is AdminExercise => !!ex)
            .map((ex) => {
                const video = (
                    ex.videos as
                        | {
                              thumbnail_url?: string | null;
                              cdn_url?: string | null;
                              url?: string | null;
                          }[]
                        | undefined
                )?.[0];
                return {
                    id: ex.id,
                    exerciseId: ex.id,
                    name: ex.name,
                    thumbnailUrl: video?.thumbnail_url ?? null,
                    videoUrl: video?.cdn_url ?? video?.url ?? null,
                    days: [],
                    period: null,
                    setsMin: null,
                    setsMax: null,
                    repetitionsMin: null,
                    repetitionsMax: null,
                    loadMin: null,
                    loadMax: null,
                    restTime: null,
                    notes: '',
                    isConfigured: false,
                };
            });

        // Remove exercises that were deselected
        const updatedGroups = groups
            .map((g) => ({
                ...g,
                exercises: g.exercises.filter((e) =>
                    selectedIds.includes(e.exerciseId),
                ),
            }))
            .filter((g) => g.exercises.length > 0);

        if (newExercises.length > 0) {
            if (updatedGroups.length === 0) {
                updatedGroups.push({
                    id: Date.now(),
                    name: 'Novo grupo',
                    exercises: newExercises,
                });
            } else {
                updatedGroups[0] = {
                    ...updatedGroups[0],
                    exercises: [...updatedGroups[0].exercises, ...newExercises],
                };
            }
        }

        setGroups(
            updatedGroups.length > 0
                ? updatedGroups
                : [{ id: Date.now(), name: 'Novo grupo', exercises: [] }],
        );
        setStep(2);
    };

    const handleEditExercise = (groupId: number, exerciseId: number) => {
        setEditingExercise({ groupId, exerciseId });
    };

    const handleSaveExercise = (updated: AdminWizardExercise) => {
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

    const handleSaveProgram = (dto: AdminProgramWriteDto) => {
        updateMutation.mutate(dto, {
            onError: () => toast.error('Erro ao atualizar programa.'),
        });
    };

    const currentEditExercise =
        editingExercise &&
        groups
            .find((g) => g.id === editingExercise.groupId)
            ?.exercises.find((e) => e.id === editingExercise.exerciseId);

    const handleHeaderBack = () => {
        if (step === 1) {
            navigate(`/admin/programas/${programId}`);
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
        setStep(2);
    };

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-xl font-semibold text-foreground">
                                {STEP_LABELS[step]}
                            </h1>
                            <BackButton
                                onClick={handleHeaderBack}
                                className="shrink-0"
                            />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {step === 1 && (
                        <AdminStepSelectExercises
                            exercises={exercises}
                            isLoading={isLoadingExercises}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                            onRemove={removeSelected}
                            onNext={goToStep2}
                        />
                    )}

                    {step === 2 && (
                        <div className="flex min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                                <AdminStepConfigureExercises
                                    groups={groups}
                                    onUpdateGroups={setGroups}
                                    onEditExercise={handleEditExercise}
                                    onNext={() => {
                                        setEditingExercise(null);
                                        setStep(3);
                                    }}
                                />
                            </div>
                            {currentEditExercise && (
                                <AdminEditExercisePanel
                                    exercise={currentEditExercise}
                                    onSave={handleSaveExercise}
                                    onClose={() => setEditingExercise(null)}
                                />
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <AdminStepProgramDetails
                            groups={groups}
                            onSave={handleSaveProgram}
                            isSaving={updateMutation.isPending}
                            initialValues={{
                                title: program.title,
                                description: program.description,
                                physioAreaId: program.physioAreaId,
                                physioSubareaId: program.physioSubareaId,
                                durationMinutes: program.durationMinutes,
                                isActive: program.isActive,
                            }}
                        />
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
