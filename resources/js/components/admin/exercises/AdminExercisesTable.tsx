import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
    DIFFICULTY_LABELS,
    DIFFICULTY_VARIANTS,
    MOVEMENT_FORM_LABELS,
} from '@/application/admin';
import type { AdminExercise } from '@/application/admin/ports';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AdminExercisesTableProps {
    exercises: AdminExercise[];
    isLoading: boolean;
    onDelete: (id: number, name: string) => void;
    isDeleting: boolean;
}

export function AdminExercisesTable({
    exercises,
    isLoading,
    onDelete,
    isDeleting,
}: AdminExercisesTableProps) {
    const navigate = useNavigate();

    return (
        <div className="rounded-lg border border-border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-14">ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Região</TableHead>
                        <TableHead>Dificuldade</TableHead>
                        <TableHead>Movimento</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead className="w-28 text-center">
                            Ações
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="py-8 text-center text-muted-foreground"
                            >
                                Carregando...
                            </TableCell>
                        </TableRow>
                    ) : exercises.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={8}
                                className="py-8 text-center text-muted-foreground"
                            >
                                Nenhum exercício encontrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        exercises.map((ex) => (
                            <TableRow key={ex.id}>
                                <TableCell className="font-medium">
                                    {ex.id}
                                </TableCell>
                                <TableCell>{ex.name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {ex.physio_area?.name ?? '—'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {ex.body_region?.name ?? '—'}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge
                                        variant={
                                            DIFFICULTY_VARIANTS[
                                                ex.difficulty_level
                                            ] ?? 'neutral'
                                        }
                                    >
                                        {DIFFICULTY_LABELS[
                                            ex.difficulty_level
                                        ] ?? ex.difficulty_level}
                                    </StatusBadge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {ex.movement_form
                                        ? (MOVEMENT_FORM_LABELS[
                                              ex.movement_form
                                          ] ?? ex.movement_form)
                                        : '—'}
                                </TableCell>
                                <TableCell>
                                    {ex.is_active ? 'Sim' : 'Não'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/exercicios/${ex.id}`,
                                                        )
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Ver</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/exercicios/${ex.id}/editar`,
                                                        )
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Editar
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive/70 hover:text-destructive"
                                                    onClick={() =>
                                                        onDelete(ex.id, ex.name)
                                                    }
                                                    disabled={isDeleting}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Excluir
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
