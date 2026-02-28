import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';

import FlashMessage from '@/components/flash-message';
import { Button } from '@/components/ui/button';
import { ExercisesTab, HistoryTab } from '@/domains/clinic/treatment-plans';
import type { ServerExerciseFilters } from '@/domains/clinic/treatment-plans/types';
import ClinicLayout from '@/layouts/clinic-layout';
import { cn } from '@/lib/utils';
import * as treatmentPlansRoute from '@/routes/clinic/treatment-plans';
import type { PaginatedResponse } from '@/types/pagination';
import type { BodyRegion, Exercise, Patient, PhysioArea, TreatmentPlan } from '@/types';

interface IndexProps {
    tab: 'historico' | 'exercicios';
    // aba Histórico
    plans: PaginatedResponse<TreatmentPlan>;
    filters: {
        search?: string;
        status?: string;
        patient_id?: string;
        physio_area_id?: string;
    };
    statuses: Record<string, string>;
    patients: Patient[];
    // aba Exercícios
    exercises: PaginatedResponse<Exercise>;
    exerciseFilters: ServerExerciseFilters;
    bodyRegions: BodyRegion[];
    difficulties: Record<string, string>;
    movementForms: Record<string, string>;
    // compartilhado
    physioAreas: PhysioArea[];
}

export default function Index({
    tab,
    plans,
    filters,
    statuses,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    patients: _patients,
    exercises,
    exerciseFilters,
    physioAreas,
    bodyRegions,
    difficulties,
    movementForms,
}: IndexProps) {
    const [planSearch, setPlanSearch] = useState(filters.search ?? '');

    const goToTab = useCallback((targetTab: 'historico' | 'exercicios') => {
        router.get(
            treatmentPlansRoute.index().url,
            targetTab === 'historico' ? {} : { tab: 'exercicios' },
            { preserveState: false },
        );
    }, []);

    const applyPlanSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            router.get(
                treatmentPlansRoute.index().url,
                { search: planSearch || undefined },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        },
        [planSearch],
    );

    const handleDelete = useCallback((id: number, title: string) => {
        if (!confirm(`Tem certeza que deseja excluir o programa "${title}"?`)) return;
        router.delete(treatmentPlansRoute.destroy(id).url);
    }, []);

    const handleDuplicate = useCallback((id: number) => {
        router.post(treatmentPlansRoute.duplicate(id).url);
    }, []);

    return (
        <ClinicLayout>
            <Head title="Programas e Exercícios" />

            <div className="flex h-full flex-col">
                {/* Header fixo com tabs */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                    <div className="px-6 pb-0 pt-6">
                        <FlashMessage />

                        <div className="mb-4 flex items-center justify-between">
                            <h1 className="text-2xl font-semibold text-foreground">Programas e Exercícios</h1>
                            <Link href={treatmentPlansRoute.create().url}>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Criar programa
                                </Button>
                            </Link>
                        </div>

                        <div className="flex gap-0">
                            <button
                                type="button"
                                onClick={() => tab !== 'historico' && goToTab('historico')}
                                className={cn(
                                    'border-b-2 px-4 pb-3 text-sm font-medium transition-colors',
                                    tab === 'historico'
                                        ? 'border-primary text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                Histórico
                            </button>
                            <button
                                type="button"
                                onClick={() => tab !== 'exercicios' && goToTab('exercicios')}
                                className={cn(
                                    'border-b-2 px-4 pb-3 text-sm font-medium transition-colors',
                                    tab === 'exercicios'
                                        ? 'border-primary text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                Exercícios
                            </button>
                        </div>
                    </div>
                </header>

                {tab === 'historico' ? (
                    <HistoryTab
                        plans={plans}
                        filters={filters}
                        statuses={statuses}
                        planSearch={planSearch}
                        setPlanSearch={setPlanSearch}
                        onSearch={applyPlanSearch}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                    />
                ) : (
                    <ExercisesTab
                        exercises={exercises}
                        serverExerciseFilters={exerciseFilters}
                        physioAreas={physioAreas}
                        bodyRegions={bodyRegions}
                        difficulties={difficulties}
                        movementForms={movementForms}
                        tab={tab}
                    />
                )}
            </div>
        </ClinicLayout>
    );
}
