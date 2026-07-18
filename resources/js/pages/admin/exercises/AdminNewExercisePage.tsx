import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
    useAdminExerciseOptions,
    useCreateAdminExercise,
} from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    ExerciseForm,
    type ExerciseFormState,
} from '@/components/admin/exercises/ExerciseForm';
import { BackButton } from '@/components/ui/back-button';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
const INITIAL_FORM: ExerciseFormState = {
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
};

export default function AdminNewExercisePage() {
    const navigate = useNavigate();
    const { data: options } = useAdminExerciseOptions();
    const createMutation = useCreateAdminExercise();

    const [form, setForm] = useState<ExerciseFormState>(INITIAL_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setField = (
        field: keyof ExerciseFormState,
        value: string | boolean,
    ) => {
        setForm((p) => ({ ...p, [field]: value }));
        if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const payload: Record<string, unknown> = {
            name: form.name,
            physio_area_id: parseInt(form.physio_area_id, 10),
            physio_subarea_id: form.physio_subarea_id
                ? parseInt(form.physio_subarea_id, 10)
                : null,
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
            repetitions: form.repetitions
                ? parseInt(form.repetitions, 10)
                : null,
            rest_time: form.rest_time ? parseInt(form.rest_time, 10) : null,
            clinical_notes: form.clinical_notes || null,
            video_id: form.video_id ? parseInt(form.video_id, 10) : null,
            is_active: form.is_active,
        };
        createMutation.mutate(payload, {
            onSuccess: () => {
                toast.success('Exercício criado com sucesso.');
                navigate('/admin/exercicios');
            },
            onError: (err: unknown) => {
                const data = (
                    err as {
                        response?: {
                            data?: {
                                message?: string;
                                errors?: Record<string, string[]>;
                            };
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

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="space-y-3 px-6 py-4">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link to="/admin/exercicios">
                                            Exercícios
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        Novo Exercício
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex items-center justify-between gap-3">
                            <h1 className="text-2xl font-semibold text-foreground">
                                Novo Exercício
                            </h1>
                            <BackButton onClick={() => navigate(-1)} />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <ExerciseForm
                        form={form}
                        setField={setField}
                        errors={errors}
                        options={options}
                        submitLabel="Salvar Exercício"
                        isPending={createMutation.isPending}
                        onSubmit={handleSubmit}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
