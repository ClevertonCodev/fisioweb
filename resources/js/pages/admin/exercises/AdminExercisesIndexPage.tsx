import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
    useAdminExerciseOptions,
    useAdminExercises,
    useDeleteAdminExercise,
} from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminExercisesTable } from '@/components/admin/exercises/AdminExercisesTable';
import { ExerciseFiltersCard } from '@/components/admin/exercises/ExerciseFiltersCard';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

export default function AdminExercisesIndexPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [physioAreaId, setPhysioAreaId] = useState<string>('');
    const [bodyRegionId, setBodyRegionId] = useState<string>('');
    const [difficultyLevel, setDifficultyLevel] = useState<string>('');
    const [movementForm, setMovementForm] = useState<string>('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    const params = {
        search: appliedSearch || undefined,
        physio_area_id: physioAreaId ? parseInt(physioAreaId, 10) : undefined,
        body_region_id: bodyRegionId ? parseInt(bodyRegionId, 10) : undefined,
        difficulty_level: difficultyLevel || undefined,
        movement_form: movementForm || undefined,
        per_page: perPage,
        page,
    };

    const { data: exercisesData, isLoading } = useAdminExercises(params);
    const exercises = exercisesData?.data ?? [];
    const lastPage = exercisesData?.meta.lastPage ?? 1;
    const total = exercisesData?.meta.total ?? 0;
    const { data: options } = useAdminExerciseOptions();
    const deleteMutation = useDeleteAdminExercise();

    const handleDelete = (id: number, name: string) => {
        if (!window.confirm(`Excluir o exercício "${name}"?`)) return;
        deleteMutation.mutate(id, {
            onSuccess: () => toast.success('Exercício removido.'),
            onError: (err: unknown) => {
                const res = (
                    err as { response?: { data?: { message?: string } } }
                )?.response?.data;
                toast.error(res?.message ?? 'Erro ao excluir.');
            },
        });
    };

    const clearFilters = () => {
        setSearch('');
        setAppliedSearch('');
        setPhysioAreaId('');
        setBodyRegionId('');
        setDifficultyLevel('');
        setMovementForm('');
        setPage(1);
    };

    const setAndResetPage = (setter: (v: string) => void, value: string) => {
        setter(value === 'todos' ? '' : value);
        setPage(1);
    };

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="flex items-center justify-between px-6 py-4">
                        <h1 className="text-2xl font-semibold text-foreground">
                            Exercícios
                        </h1>
                        <Button
                            onClick={() => navigate('/admin/exercicios/novo')}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Novo Exercício
                        </Button>
                    </div>
                </header>

                <div className="flex-1 space-y-4 overflow-auto p-6">
                    <ExerciseFiltersCard
                        search={search}
                        onSearchChange={(v) => setSearch(v)}
                        physioAreaId={physioAreaId}
                        onPhysioAreaChange={(v) =>
                            setAndResetPage(setPhysioAreaId, v)
                        }
                        bodyRegionId={bodyRegionId}
                        onBodyRegionChange={(v) =>
                            setAndResetPage(setBodyRegionId, v)
                        }
                        difficultyLevel={difficultyLevel}
                        onDifficultyChange={(v) =>
                            setAndResetPage(setDifficultyLevel, v)
                        }
                        movementForm={movementForm}
                        onMovementFormChange={(v) =>
                            setAndResetPage(setMovementForm, v)
                        }
                        onSearch={() => {
                            setAppliedSearch(search);
                            setPage(1);
                        }}
                        onClear={clearFilters}
                        options={options}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>
                            Total de <strong>exercícios</strong>:{' '}
                            <strong>{total}</strong>
                            {lastPage > 1 && (
                                <span className="ml-2">
                                    ( página {page} de {lastPage} )
                                </span>
                            )}
                        </span>
                        <div className="flex items-center gap-2">
                            <span>Itens por página</span>
                            <Select
                                value={String(perPage)}
                                onValueChange={(v) => {
                                    setPerPage(Number(v));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[5rem]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZE_OPTIONS.map((n) => (
                                        <SelectItem key={n} value={String(n)}>
                                            {n}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <AdminExercisesTable
                        exercises={exercises}
                        isLoading={isLoading}
                        onDelete={handleDelete}
                        isDeleting={deleteMutation.isPending}
                    />

                    {lastPage > 1 && (
                        <TablePagination
                            currentPage={page}
                            totalPages={lastPage}
                            onPageChange={setPage}
                        />
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
