import { Head, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';

import { Step1 } from '@/components/clinic/treatment-plan-wizard/Step1';
import { Step2 } from '@/components/clinic/treatment-plan-wizard/Step2';
import { Step4 } from '@/components/clinic/treatment-plan-wizard/Step4';
import type { ExerciseConfig, Group, Step4Data } from '@/components/clinic/treatment-plan-wizard/types';
import ClinicLayout from '@/layouts/clinic-layout';
import type { Exercise, Patient, PhysioArea, TreatmentPlan } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditProps {
    plan: TreatmentPlan;
    patients: Patient[];
    physioAreas: PhysioArea[];
    statuses: Record<string, string>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInitialConfigs(plan: TreatmentPlan): ExerciseConfig[] {
    const groupIdToIndex = new Map((plan.groups ?? []).map((g, i) => [g.id, i]));

    return (plan.exercises ?? []).map((e, i) => ({
        exercise_id: e.exercise_id,
        exercise: e.exercise as Exercise,
        group_index: e.treatment_plan_group_id !== null
            ? (groupIdToIndex.get(e.treatment_plan_group_id) ?? null)
            : null,
        days_of_week: e.days_of_week ?? [],
        all_days: (e.days_of_week ?? []).length === 7,
        period: e.period ?? '',
        sets_min: e.sets_min != null ? String(e.sets_min) : '',
        sets_max: e.sets_max != null ? String(e.sets_max) : '',
        repetitions_min: e.repetitions_min != null ? String(e.repetitions_min) : '',
        repetitions_max: e.repetitions_max != null ? String(e.repetitions_max) : '',
        load_min: e.load_min != null ? String(e.load_min) : '',
        load_max: e.load_max != null ? String(e.load_max) : '',
        rest_time: e.rest_time ?? '',
        notes: e.notes ?? '',
        sort_order: i,
    }));
}

function buildInitialGroups(plan: TreatmentPlan): Group[] {
    return (plan.groups ?? []).map((g, i) => ({ name: g.name, sort_order: i }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Edit({ plan, patients, physioAreas, statuses }: EditProps) {
    const [step, setStep] = useState<1 | 2 | 4>(1);
    const [configs, setConfigs] = useState<ExerciseConfig[]>(() => buildInitialConfigs(plan));
    const [groups, setGroups] = useState<Group[]>(() => buildInitialGroups(plan));
    const [processing, setProcessing] = useState(false);

    const handleSelect = useCallback((exercise: Exercise) => {
        setConfigs((prev) => [
            ...prev,
            {
                exercise_id: exercise.id,
                exercise,
                group_index: null,
                days_of_week: [],
                all_days: false,
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
    }, []);

    const handleRemove = useCallback((exerciseId: number) => {
        setConfigs((prev) =>
            prev.filter((c) => c.exercise_id !== exerciseId).map((c, i) => ({ ...c, sort_order: i })),
        );
    }, []);

    const handleSubmit = useCallback(
        (details: Step4Data) => {
            setProcessing(true);
            const payload = {
                title: details.title,
                patient_id: details.patient_id || null,
                start_date: details.start_date || null,
                end_date: details.end_date || null,
                message: details.message || null,
                status: details.status,
                groups: groups.map((g, i) => ({ name: g.name, sort_order: i })),
                exercises: configs.map((c, i) => ({
                    exercise_id: c.exercise_id,
                    group_index: c.group_index,
                    days_of_week: c.days_of_week.length > 0 ? c.days_of_week : null,
                    period: c.period || null,
                    sets_min: c.sets_min ? Number(c.sets_min) : null,
                    sets_max: c.sets_max ? Number(c.sets_max) : null,
                    repetitions_min: c.repetitions_min ? Number(c.repetitions_min) : null,
                    repetitions_max: c.repetitions_max ? Number(c.repetitions_max) : null,
                    load_min: c.load_min ? Number(c.load_min) : null,
                    load_max: c.load_max ? Number(c.load_max) : null,
                    rest_time: c.rest_time || null,
                    notes: c.notes || null,
                    sort_order: i,
                })),
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.put(`/clinic/treatment-plans/${plan.id}`, payload as any, {
                onFinish: () => setProcessing(false),
            });
        },
        [configs, groups, plan.id],
    );

    const initialStep4Data: Partial<Step4Data> = {
        title: plan.title,
        patient_id: plan.patient_id ? String(plan.patient_id) : '',
        start_date: plan.start_date ?? '',
        end_date: plan.end_date ?? '',
        message: plan.message ?? '',
        status: plan.status,
    };

    return (
        <ClinicLayout>
            <Head title={`Editar: ${plan.title}`} />
            <div className="flex h-full flex-col overflow-hidden">
                {step === 1 && (
                    <Step1
                        title="Editar programa"
                        backUrl={`/clinic/treatment-plans/${plan.id}`}
                        physioAreas={physioAreas}
                        selected={configs}
                        onSelect={handleSelect}
                        onRemove={handleRemove}
                        onAdvance={() => setStep(2)}
                    />
                )}
                {step === 2 && (
                    <Step2
                        configs={configs}
                        groups={groups}
                        onUpdateConfigs={setConfigs}
                        onUpdateGroups={setGroups}
                        onBack={() => setStep(1)}
                        onAdvance={() => setStep(4)}
                    />
                )}
                {step === 4 && (
                    <Step4
                        patients={patients}
                        configs={configs}
                        initialData={initialStep4Data}
                        statuses={statuses}
                        submitLabel="Salvar Alterações"
                        onBack={() => setStep(2)}
                        onSubmit={handleSubmit}
                        processing={processing}
                    />
                )}
            </div>
        </ClinicLayout>
    );
}
