import { ArrowLeft } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAdminExercises, useCreateAdminProgram } from '@/application/admin';
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
import { Button } from '@/components/ui/button';

type WizardStep = 1 | 2 | 3;

const STEP_LABELS: Record<WizardStep, string> = {
    1: 'Novo programa',
    2: 'Configurar exercícios',
    3: 'Detalhes do programa',
};

export default function ProgramNewPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<WizardStep>(1);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [groups, setGroups] = useState<AdminWizardGroup[]>([]);
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

    const createMutation = useCreateAdminProgram({
        onSuccess: (id) => {
            toast.success('Programa criado com sucesso!');
            navigate(`/admin/programas/${id}`);
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
        const wizardExercises: AdminWizardExercise[] = selectedIds
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

        if (groups.length === 0) {
            setGroups([
                {
                    id: Date.now(),
                    name: 'Novo grupo',
                    exercises: wizardExercises,
                },
            ]);
        }
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
        createMutation.mutate(dto, {
            onError: () => toast.error('Erro ao salvar programa.'),
        });
    };

    const currentEditExercise =
        editingExercise &&
        groups
            .find((g) => g.id === editingExercise.groupId)
            ?.exercises.find((e) => e.id === editingExercise.exerciseId);

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="px-6 py-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (step === 1) {
                                        navigate('/admin/programas');
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
                                }}
                                className="gap-1 text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Voltar
                            </Button>
                        </div>
                        <h1 className="mt-2 text-xl font-semibold text-foreground">
                            {STEP_LABELS[step]}
                        </h1>
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
                                    onBack={() => {
                                        setEditingExercise(null);
                                        setStep(1);
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
                            onBack={() => setStep(2)}
                            onSave={handleSaveProgram}
                            isSaving={createMutation.isPending}
                        />
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
