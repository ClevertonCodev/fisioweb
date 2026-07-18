import { Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useAdminExercise, useDeleteAdminExercise } from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BackButton } from '@/components/ui/back-button';
import { ExerciseDetailContent } from '@/components/admin/exercises/ExerciseDetailContent';
import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

export default function AdminExerciseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const exerciseId = id ? parseInt(id, 10) : undefined;
    const { data: exercise, isLoading, error } = useAdminExercise(exerciseId);
    const deleteMutation = useDeleteAdminExercise();

    const handleDelete = () => {
        if (!exercise) return;
        if (
            !window.confirm(
                `Tem certeza que deseja remover "${exercise.name}"?`,
            )
        )
            return;
        deleteMutation.mutate(exercise.id, {
            onSuccess: () => {
                toast.success('Exercício removido.');
                navigate('/admin/exercicios');
            },
            onError: (err: unknown) => {
                const res = (
                    err as { response?: { data?: { message?: string } } }
                )?.response?.data;
                toast.error(res?.message ?? 'Erro ao excluir.');
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
                                        {exercise.name}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-semibold text-foreground">
                                        {exercise.name}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        ID: {exercise.id} | Criado em:{' '}
                                        {exercise.created_at}
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        exercise.is_active
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {exercise.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <BackButton
                                    onClick={() => navigate(-1)}
                                    className="shrink-0"
                                />
                                <Button
                                    onClick={() =>
                                        navigate(
                                            `/admin/exercicios/${exercise.id}/editar`,
                                        )
                                    }
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                    className="gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Remover
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 space-y-6 overflow-auto p-6">
                    <ExerciseDetailContent exercise={exercise} />
                </div>
            </div>
        </AdminLayout>
    );
}
