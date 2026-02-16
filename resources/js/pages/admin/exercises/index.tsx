import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import FlashMessage from '@/components/flash-message';
import { Table } from '@/components/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import {
    type BreadcrumbItem,
    type BodyRegion,
    type Exercise,
    type PhysioArea,
} from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Exercícios', href: '/admin/exercises' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

interface ExercisesIndexProps {
    exercises: {
        data: Exercise[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search?: string;
        physio_area_id?: string;
        body_region_id?: string;
        difficulty_level?: string;
        movement_form?: string;
    };
    physioAreas: PhysioArea[];
    bodyRegions: BodyRegion[];
    difficulties: Record<string, string>;
    movementForms: Record<string, string>;
}

export default function Index({
    exercises,
    filters,
    physioAreas,
    bodyRegions,
    difficulties,
    movementForms,
}: ExercisesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [physioAreaId, setPhysioAreaId] = useState(filters.physio_area_id || '');
    const [bodyRegionId, setBodyRegionId] = useState(filters.body_region_id || '');
    const [difficultyLevel, setDifficultyLevel] = useState(filters.difficulty_level || '');
    const [movementForm, setMovementForm] = useState(filters.movement_form || '');

    const applyFilters = useCallback(() => {
        router.get(
            '/admin/exercises',
            {
                search: search || undefined,
                physio_area_id: physioAreaId || undefined,
                body_region_id: bodyRegionId || undefined,
                difficulty_level: difficultyLevel || undefined,
                movement_form: movementForm || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, [search, physioAreaId, bodyRegionId, difficultyLevel, movementForm]);

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            applyFilters();
        },
        [applyFilters],
    );

    const clearFilters = useCallback(() => {
        setSearch('');
        setPhysioAreaId('');
        setBodyRegionId('');
        setDifficultyLevel('');
        setMovementForm('');
        router.get('/admin/exercises', {}, { preserveState: false });
    }, []);

    const handleDelete = useCallback((id: number, name: string) => {
        if (confirm(`Tem certeza que deseja remover o exercício "${name}"?`)) {
            router.delete(`/admin/exercises/${id}`);
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exercícios" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Exercícios</h1>
                    <Link href="/admin/exercises/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Novo Exercício
                        </Button>
                    </Link>
                </div>

                {/* Filtros */}
                <div className="rounded-xl border border-sidebar-border/70 bg-card p-4">
                    <h2 className="mb-4 text-lg font-semibold">Filtros</h2>
                    <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                        <div className="space-y-2">
                            <Label htmlFor="search">Buscar</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="search"
                                    type="text"
                                    placeholder="Nome, músculo, objetivo..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Área</Label>
                            <Select value={physioAreaId} onValueChange={setPhysioAreaId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
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
                            <Label>Região do Corpo</Label>
                            <Select value={bodyRegionId} onValueChange={setBodyRegionId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bodyRegions.map((region) => (
                                        <React.Fragment key={region.id}>
                                            <SelectItem value={String(region.id)} className="font-semibold">
                                                {region.name}
                                            </SelectItem>
                                            {region.children?.map((child) => (
                                                <SelectItem key={child.id} value={String(child.id)}>
                                                    &nbsp;&nbsp;{child.name}
                                                </SelectItem>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Dificuldade</Label>
                            <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(difficulties).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Forma Movimento</Label>
                            <Select value={movementForm} onValueChange={setMovementForm}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(movementForms).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button type="submit" className="flex-1">
                                Buscar
                            </Button>
                            <Button type="button" variant="outline" onClick={clearFilters}>
                                Limpar
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Tabela */}
                <div className="flex-1">
                    <Table
                        columns={[
                            { title: 'ID', key: 'id' },
                            { title: 'Nome', key: 'name' },
                            { title: 'Área', key: 'area' },
                            { title: 'Região', key: 'region' },
                            { title: 'Dificuldade', key: 'difficulty' },
                            { title: 'Movimento', key: 'movement' },
                            { title: 'Ações', key: 'actions' },
                        ]}
                        data={exercises.data}
                        emptyMessage="Nenhum exercício encontrado"
                        pagination={{
                            links: exercises.links,
                            total: exercises.total,
                            currentCount: exercises.data.length,
                            label: 'exercícios',
                            lastPage: exercises.last_page,
                            currentPage: exercises.current_page,
                        }}
                    >
                        {(exercise: Exercise) => (
                            <tr
                                key={exercise.id}
                                className="border-b border-sidebar-border/70 transition-colors hover:bg-accent/50"
                            >
                                <td className="px-4 py-3 text-sm">{exercise.id}</td>
                                <td className="px-4 py-3 text-sm font-medium">
                                    <Link
                                        href={`/admin/exercises/${exercise.id}`}
                                        className="text-primary hover:underline"
                                    >
                                        {exercise.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {exercise.physio_area?.name || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {exercise.body_region?.name || '-'}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${DIFFICULTY_COLORS[exercise.difficulty_level] || ''}`}
                                    >
                                        {difficulties[exercise.difficulty_level] || exercise.difficulty_level}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {movementForms[exercise.movement_form || ''] || '-'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <Link href={`/admin/exercises/${exercise.id}`}>
                                            <Button variant="ghost" size="icon" title="Ver detalhes">
                                                <Eye className="size-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/admin/exercises/${exercise.id}/edit`}>
                                            <Button variant="ghost" size="icon" title="Editar">
                                                <Pencil className="size-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Remover"
                                            onClick={() => handleDelete(exercise.id, exercise.name)}
                                        >
                                            <Trash2 className="size-4 text-destructive" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
