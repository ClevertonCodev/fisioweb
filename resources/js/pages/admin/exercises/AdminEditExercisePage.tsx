import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
    useAdminExercise,
    useAdminExerciseOptions,
    useUpdateAdminExercise,
} from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ExerciseForm, type ExerciseFormState } from '@/components/admin/exercises/ExerciseForm';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

export default function AdminEditExercisePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const exerciseId = id ? parseInt(id, 10) : undefined;
    const { data: exercise, isLoading, error } = useAdminExercise(exerciseId);
    const { data: options } = useAdminExerciseOptions();
    const updateMutation = useUpdateAdminExercise(exerciseId!);

    const [form, setForm] = useState<ExerciseFormState>({
        name: '',
        physio_area_id: '',
        physio_subarea_id: '',
        body_region_id: '',
        therapeutic_goal: '',
        description: '',
        audio_description: '',
        difficulty_level: 'medium',
        muscle_group: '',
        movement_type: '',
        movement_form: '',
        kinetic_chain: '',
        decubitus: '',
        indications: '',
        contraindications: '',
        frequency: '',
        sets: '',
        repetitions: '',
        rest_time: '',
        clinical_notes: '',
        video_id: '',
        is_active: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (exercise) {
            const firstVideo = (exercise.videos as { id: number }[] | undefined)?.[0];
            setForm({
                name: exercise.name,
                physio_area_id: String(exercise.physio_area_id),
                physio_subarea_id:
                    exercise.physio_subarea_id != null ? String(exercise.physio_subarea_id) : '',
                body_region_id: String(exercise.body_region_id),
                therapeutic_goal: exercise.therapeutic_goal ?? '',
                description: exercise.description ?? '',
                audio_description: exercise.audio_description ?? '',
                difficulty_level: exercise.difficulty_level,
                muscle_group: exercise.muscle_group ?? '',
                movement_type: exercise.movement_type ?? '',
                movement_form: exercise.movement_form ?? '',
                kinetic_chain: exercise.kinetic_chain ?? '',
                decubitus: exercise.decubitus ?? '',
                indications: exercise.indications ?? '',
                contraindications: exercise.contraindications ?? '',
                frequency: exercise.frequency ?? '',
                sets: exercise.sets != null ? String(exercise.sets) : '',
                repetitions: exercise.repetitions != null ? String(exercise.repetitions) : '',
                rest_time: exercise.rest_time != null ? String(exercise.rest_time) : '',
                clinical_notes: exercise.clinical_notes ?? '',
                video_id: firstVideo ? String(firstVideo.id) : '',
                is_active: exercise.is_active,
            });
        }
    }, [exercise]);

    const setField = (field: keyof ExerciseFormState, value: string | boolean) => {
        setForm((p) => ({ ...p, [field]: value }));
        if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const payload: Record<string, unknown> = {
            name: form.name,
            physio_area_id: parseInt(form.physio_area_id, 10),
            physio_subarea_id: form.physio_subarea_id ? parseInt(form.physio_subarea_id, 10) : null,
            body_region_id: parseInt(form.body_region_id, 10),
            therapeutic_goal: form.therapeutic_goal || null,
            description: form.description || null,
            audio_description: form.audio_description || null,
            difficulty_level: form.difficulty_level,
            muscle_group: form.muscle_group || null,
            movement_type: form.movement_type || null,
            movement_form: form.movement_form || null,
            kinetic_chain: form.kinetic_chain || null,
            decubitus: form.decubitus || null,
            indications: form.indications || null,
            contraindications: form.contraindications || null,
            frequency: form.frequency || null,
            sets: form.sets ? parseInt(form.sets, 10) : null,
            repetitions: form.repetitions ? parseInt(form.repetitions, 10) : null,
            rest_time: form.rest_time ? parseInt(form.rest_time, 10) : null,
            clinical_notes: form.clinical_notes || null,
            video_id: form.video_id ? parseInt(form.video_id, 10) : null,
            is_active: form.is_active,
        };
        updateMutation.mutate(payload, {
            onSuccess: () => {
                toast.success('Exercício atualizado.');
                navigate('/admin/exercicios');
            },
            onError: (err: unknown) => {
                const data = (
                    err as {
                        response?: {
                            data?: { message?: string; errors?: Record<string, string[]> };
                        };
                    }
                )?.response?.data;
                const msg = data?.message;
                const errs = data?.errors;
                if (msg) toast.error(msg);
                if (errs) {
                    const mapped: Record<string, string> = {};
                    for (const [k, v] of Object.entries(errs)) {
                        mapped[k] = Array.isArray(v) ? v[0] : String(v);
                    }
                    setErrors(mapped);
                }
            },
        });
    };

    if (exerciseId == null || isNaN(exerciseId)) {
        navigate('/admin/exercicios');
        return null;
    }
    if (isLoading || (!exercise && !error)) {
        return (
            <AdminLayout>
                <div className="p-6">Carregando...</div>
            </AdminLayout>
        );
    }
    if (error || !exercise) {
        navigate('/admin/exercicios');
        return null;
    }

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                <header className="bg-background/95 border-border sticky top-0 z-10 border-b backdrop-blur">
                    <div className="space-y-3 px-6 py-4">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link to="/admin/exercicios">Exercícios</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Editar: {exercise.name}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h1 className="text-foreground text-2xl font-semibold">
                                Editar Exercício
                            </h1>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <ExerciseForm
                        form={form}
                        setField={setField}
                        errors={errors}
                        options={options}
                        submitLabel="Salvar alterações"
                        isPending={updateMutation.isPending}
                        onSubmit={handleSubmit}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
