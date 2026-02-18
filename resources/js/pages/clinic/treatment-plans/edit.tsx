import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, GripVertical, Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import FlashMessage from '@/components/flash-message';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import ClinicLayout from '@/layouts/clinic-layout';
import type { Exercise, Patient, PhysioArea, PhysioSubarea, TreatmentPlan } from '@/types';

interface ExerciseFormData {
    exercise_id: number;
    exercise?: Exercise;
    treatment_plan_group_id: number | null;
    days_of_week: string[];
    period: string;
    sets_min: string;
    sets_max: string;
    repetitions_min: string;
    repetitions_max: string;
    load_min: string;
    load_max: string;
    rest_time: string;
    notes: string;
    sort_order: number;
}

interface GroupFormData {
    name: string;
    sort_order: number;
}

interface EditProps {
    plan: TreatmentPlan;
    patients: Patient[];
    physioAreas: PhysioArea[];
    physioSubareas: PhysioSubarea[];
    statuses: Record<string, string>;
    periods: Record<string, string>;
}

const DAYS_OF_WEEK = [
    { value: 'mon', label: 'Seg' },
    { value: 'tue', label: 'Ter' },
    { value: 'wed', label: 'Qua' },
    { value: 'thu', label: 'Qui' },
    { value: 'fri', label: 'Sex' },
    { value: 'sat', label: 'Sáb' },
    { value: 'sun', label: 'Dom' },
];

export default function Edit({ plan, patients, physioAreas, physioSubareas, statuses, periods }: EditProps) {
    const [exercises, setExercises] = useState<ExerciseFormData[]>(
        (plan.exercises || []).map((e, i) => ({
            exercise_id: e.exercise_id,
            exercise: e.exercise,
            treatment_plan_group_id: e.treatment_plan_group_id,
            days_of_week: e.days_of_week || [],
            period: e.period || '',
            sets_min: e.sets_min != null ? String(e.sets_min) : '',
            sets_max: e.sets_max != null ? String(e.sets_max) : '',
            repetitions_min: e.repetitions_min != null ? String(e.repetitions_min) : '',
            repetitions_max: e.repetitions_max != null ? String(e.repetitions_max) : '',
            load_min: e.load_min != null ? String(e.load_min) : '',
            load_max: e.load_max != null ? String(e.load_max) : '',
            rest_time: e.rest_time || '',
            notes: e.notes || '',
            sort_order: i,
        })),
    );
    const [groups, setGroups] = useState<GroupFormData[]>(
        (plan.groups || []).map((g) => ({ name: g.name, sort_order: g.sort_order })),
    );
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [loadingExercises, setLoadingExercises] = useState(false);

    const { data, setData, processing, errors, clearErrors } = useForm({
        title: plan.title,
        patient_id: plan.patient_id ? String(plan.patient_id) : '',
        message: plan.message || '',
        physio_area_id: plan.physio_area_id ? String(plan.physio_area_id) : '',
        physio_subarea_id: plan.physio_subarea_id ? String(plan.physio_subarea_id) : '',
        start_date: plan.start_date || '',
        end_date: plan.end_date || '',
        duration_minutes: plan.duration_minutes ? String(plan.duration_minutes) : '',
        status: plan.status,
        notes: plan.notes || '',
    });

    const setField = useCallback(
        (field: string, value: string) => {
            setData(field as keyof typeof data, value);
            if (errors[field as keyof typeof errors]) clearErrors(field as keyof typeof errors);
        },
        [setData, errors, clearErrors],
    );

    const filteredSubareas = useMemo(() => {
        if (!data.physio_area_id) return [];
        return physioSubareas.filter((s) => s.physio_area_id === Number(data.physio_area_id));
    }, [data.physio_area_id, physioSubareas]);

    const searchExercises = useCallback(() => {
        setLoadingExercises(true);
        const params = new URLSearchParams();
        if (exerciseSearch) params.set('search', exerciseSearch);
        if (data.physio_area_id) params.set('physio_area_id', data.physio_area_id);

        fetch(`/clinic/exercises/search?${params.toString()}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((res) => res.json())
            .then((result) => setAvailableExercises(result.data || []))
            .catch(() => setAvailableExercises([]))
            .finally(() => setLoadingExercises(false));
    }, [exerciseSearch, data.physio_area_id]);

    const addExercise = useCallback(
        (exercise: Exercise) => {
            if (exercises.some((e) => e.exercise_id === exercise.id)) return;
            setExercises((prev) => [
                ...prev,
                {
                    exercise_id: exercise.id,
                    exercise,
                    treatment_plan_group_id: null,
                    days_of_week: [],
                    period: '',
                    sets_min: exercise.sets ? String(exercise.sets) : '',
                    sets_max: exercise.sets ? String(exercise.sets) : '',
                    repetitions_min: exercise.repetitions ? String(exercise.repetitions) : '',
                    repetitions_max: exercise.repetitions ? String(exercise.repetitions) : '',
                    load_min: '',
                    load_max: '',
                    rest_time: exercise.rest_time ? String(exercise.rest_time) : '',
                    notes: '',
                    sort_order: prev.length,
                },
            ]);
        },
        [exercises],
    );

    const removeExercise = useCallback((index: number) => {
        setExercises((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const updateExercise = useCallback((index: number, field: keyof ExerciseFormData, value: string | string[] | number | null) => {
        setExercises((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
    }, []);

    const toggleDay = useCallback((index: number, day: string) => {
        setExercises((prev) =>
            prev.map((e, i) => {
                if (i !== index) return e;
                const days = e.days_of_week.includes(day) ? e.days_of_week.filter((d) => d !== day) : [...e.days_of_week, day];
                return { ...e, days_of_week: days };
            }),
        );
    }, []);

    const addGroup = useCallback(() => {
        setGroups((prev) => [...prev, { name: '', sort_order: prev.length }]);
    }, []);

    const removeGroup = useCallback((index: number) => {
        setGroups((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const updateGroup = useCallback((index: number, name: string) => {
        setGroups((prev) => prev.map((g, i) => (i === index ? { ...g, name } : g)));
    }, []);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();

            const formData = {
                ...data,
                patient_id: data.patient_id || null,
                physio_area_id: data.physio_area_id || null,
                physio_subarea_id: data.physio_subarea_id || null,
                duration_minutes: data.duration_minutes || null,
                groups: groups.filter((g) => g.name.trim()),
                exercises: exercises.map((e, i) => ({
                    exercise_id: e.exercise_id,
                    treatment_plan_group_id: e.treatment_plan_group_id,
                    days_of_week: e.days_of_week.length > 0 ? e.days_of_week : null,
                    period: e.period || null,
                    sets_min: e.sets_min ? Number(e.sets_min) : null,
                    sets_max: e.sets_max ? Number(e.sets_max) : null,
                    repetitions_min: e.repetitions_min ? Number(e.repetitions_min) : null,
                    repetitions_max: e.repetitions_max ? Number(e.repetitions_max) : null,
                    load_min: e.load_min ? Number(e.load_min) : null,
                    load_max: e.load_max ? Number(e.load_max) : null,
                    rest_time: e.rest_time || null,
                    notes: e.notes || null,
                    sort_order: i,
                })),
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.put(`/clinic/treatment-plans/${plan.id}`, formData as any);
        },
        [data, groups, exercises, plan.id],
    );

    return (
        <ClinicLayout>
            <Head title={`Editar: ${plan.title}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto p-6">
                <FlashMessage />

                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.visit(`/clinic/treatment-plans/${plan.id}`)}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Editar Programa</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Detalhes do Programa */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">Detalhes do Programa</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="title">
                                    Título <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setField('title', e.target.value)}
                                    className={errors.title ? 'border-destructive' : ''}
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-2">
                                <Label>Paciente</Label>
                                <Select value={data.patient_id} onValueChange={(v) => setField('patient_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sem paciente (template)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={data.status} onValueChange={(v) => setField('status', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statuses).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Área da Fisioterapia</Label>
                                <Select
                                    value={data.physio_area_id}
                                    onValueChange={(v) => {
                                        setField('physio_area_id', v);
                                        setData('physio_subarea_id', '');
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {physioAreas.map((area) => (
                                            <SelectItem key={area.id} value={String(area.id)}>
                                                {area.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Subárea</Label>
                                <Select
                                    value={data.physio_subarea_id}
                                    onValueChange={(v) => setField('physio_subarea_id', v)}
                                    disabled={filteredSubareas.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={filteredSubareas.length === 0 ? 'Selecione uma área primeiro' : 'Selecione...'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredSubareas.map((sub) => (
                                            <SelectItem key={sub.id} value={String(sub.id)}>
                                                {sub.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Data de Início</Label>
                                <Input
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => setField('start_date', e.target.value)}
                                    className={errors.start_date ? 'border-destructive' : ''}
                                />
                                <InputError message={errors.start_date} />
                            </div>

                            <div className="space-y-2">
                                <Label>Data de Término</Label>
                                <Input
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) => setField('end_date', e.target.value)}
                                    className={errors.end_date ? 'border-destructive' : ''}
                                />
                                <InputError message={errors.end_date} />
                            </div>

                            <div className="space-y-2">
                                <Label>Duração Estimada (min)</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={data.duration_minutes}
                                    onChange={(e) => setField('duration_minutes', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Mensagem para o Paciente</Label>
                                <Textarea
                                    value={data.message}
                                    onChange={(e) => setField('message', e.target.value)}
                                    rows={3}
                                    maxLength={600}
                                    className={errors.message ? 'border-destructive' : ''}
                                />
                                <div className="flex justify-between">
                                    <InputError message={errors.message} />
                                    <span className="text-xs text-muted-foreground">{data.message.length}/600</span>
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Observações Internas</Label>
                                <Textarea value={data.notes} onChange={(e) => setField('notes', e.target.value)} rows={2} />
                            </div>
                        </div>
                    </div>

                    {/* Grupos */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Grupos de Exercícios</h2>
                            <Button type="button" variant="outline" size="sm" onClick={addGroup}>
                                <Plus className="mr-1 size-4" />
                                Adicionar Grupo
                            </Button>
                        </div>
                        {groups.length > 0 ? (
                            <div className="space-y-2">
                                {groups.map((group, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <GripVertical className="size-4 text-muted-foreground" />
                                        <Input value={group.name} onChange={(e) => updateGroup(index, e.target.value)} placeholder="Nome do grupo..." className="flex-1" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeGroup(index)}>
                                            <X className="size-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Grupos são opcionais.</p>
                        )}
                    </div>

                    {/* Exercícios */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Exercícios ({exercises.length})</h2>
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowExerciseSelector(!showExerciseSelector)}>
                                <Plus className="mr-1 size-4" />
                                Adicionar Exercício
                            </Button>
                        </div>

                        {showExerciseSelector && (
                            <div className="mb-6 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar exercício..."
                                            value={exerciseSearch}
                                            onChange={(e) => setExerciseSearch(e.target.value)}
                                            className="pl-9"
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchExercises())}
                                        />
                                    </div>
                                    <Button type="button" size="sm" onClick={searchExercises}>
                                        {loadingExercises ? <Spinner className="mr-1" /> : null}
                                        Buscar
                                    </Button>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setShowExerciseSelector(false)}>
                                        <X className="size-4" />
                                    </Button>
                                </div>
                                {availableExercises.length > 0 && (
                                    <div className="max-h-64 space-y-1 overflow-y-auto">
                                        {availableExercises.map((ex) => {
                                            const alreadyAdded = exercises.some((e) => e.exercise_id === ex.id);
                                            return (
                                                <div key={ex.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/50">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium">{ex.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {ex.physio_area?.name}
                                                            {ex.sets && ` | ${ex.sets} séries`}
                                                            {ex.repetitions && ` x ${ex.repetitions} reps`}
                                                        </p>
                                                    </div>
                                                    <Button type="button" size="sm" variant={alreadyAdded ? 'secondary' : 'default'} disabled={alreadyAdded} onClick={() => addExercise(ex)}>
                                                        {alreadyAdded ? 'Adicionado' : 'Adicionar'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {exercises.length > 0 ? (
                            <div className="space-y-4">
                                {exercises.map((ex, index) => (
                                    <div key={`${ex.exercise_id}-${index}`} className="rounded-lg border border-sidebar-border/70 p-4">
                                        <div className="mb-3 flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <GripVertical className="size-4 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{ex.exercise?.name}</p>
                                                    <p className="text-xs text-muted-foreground">{ex.exercise?.physio_area?.name}</p>
                                                </div>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeExercise(index)}>
                                                <Trash2 className="size-4 text-destructive" />
                                            </Button>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                            {groups.length > 0 && (
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Grupo</Label>
                                                    <Select
                                                        value={ex.treatment_plan_group_id ? String(ex.treatment_plan_group_id) : ''}
                                                        onValueChange={(v) => updateExercise(index, 'treatment_plan_group_id', v ? Number(v) : null)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Nenhum" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {groups.map((g, gi) => (
                                                                <SelectItem key={gi} value={String(gi + 1)}>
                                                                    {g.name || `Grupo ${gi + 1}`}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <Label className="text-xs">Período</Label>
                                                <Select value={ex.period} onValueChange={(v) => updateExercise(index, 'period', v)}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Qualquer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(periods).map(([key, label]) => (
                                                            <SelectItem key={key} value={key}>
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Séries (min - max)</Label>
                                                <div className="flex items-center gap-1">
                                                    <Input type="number" min="1" max="100" className="h-8 text-xs" value={ex.sets_min} onChange={(e) => updateExercise(index, 'sets_min', e.target.value)} />
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                    <Input type="number" min="1" max="100" className="h-8 text-xs" value={ex.sets_max} onChange={(e) => updateExercise(index, 'sets_max', e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Repetições (min - max)</Label>
                                                <div className="flex items-center gap-1">
                                                    <Input type="number" min="1" max="1000" className="h-8 text-xs" value={ex.repetitions_min} onChange={(e) => updateExercise(index, 'repetitions_min', e.target.value)} />
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                    <Input type="number" min="1" max="1000" className="h-8 text-xs" value={ex.repetitions_max} onChange={(e) => updateExercise(index, 'repetitions_max', e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Carga (min - max) kg</Label>
                                                <div className="flex items-center gap-1">
                                                    <Input type="number" min="0" step="0.5" className="h-8 text-xs" value={ex.load_min} onChange={(e) => updateExercise(index, 'load_min', e.target.value)} />
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                    <Input type="number" min="0" step="0.5" className="h-8 text-xs" value={ex.load_max} onChange={(e) => updateExercise(index, 'load_max', e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Descanso</Label>
                                                <Input className="h-8 text-xs" value={ex.rest_time} onChange={(e) => updateExercise(index, 'rest_time', e.target.value)} placeholder="Ex: 30s" />
                                            </div>
                                            <div className="space-y-1 sm:col-span-2">
                                                <Label className="text-xs">Observações</Label>
                                                <Input className="h-8 text-xs" value={ex.notes} onChange={(e) => updateExercise(index, 'notes', e.target.value)} placeholder="Instruções específicas..." />
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <Label className="mb-1 block text-xs">Dias da Semana</Label>
                                            <div className="flex flex-wrap gap-1">
                                                {DAYS_OF_WEEK.map((day) => (
                                                    <Badge
                                                        key={day.value}
                                                        variant={ex.days_of_week.includes(day.value) ? 'default' : 'outline'}
                                                        className="cursor-pointer select-none"
                                                        onClick={() => toggleDay(index, day.value)}
                                                    >
                                                        {day.label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum exercício. Adicione exercícios ao programa.</p>
                        )}
                    </div>

                    {/* Botões */}
                    <div className="flex items-center justify-end gap-4 border-t border-sidebar-border/70 pt-6">
                        <Button type="button" variant="outline" onClick={() => router.visit(`/clinic/treatment-plans/${plan.id}`)} disabled={processing}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner className="mr-2" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </div>
        </ClinicLayout>
    );
}
