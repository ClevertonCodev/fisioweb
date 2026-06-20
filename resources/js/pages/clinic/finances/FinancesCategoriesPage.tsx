import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
    useCreateFinanceCategory,
    useDeleteFinanceCategory,
    useFinanceCategories,
    useToggleFinanceCategory,
} from '@/application/clinic/use-finance-categories';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { FinancialTransactionType } from '@/domain/clinic/finance';

export default function FinancesCategoriesPage() {
    const { data: categories = [], isLoading } = useFinanceCategories();
    const createMutation = useCreateFinanceCategory();
    const toggleMutation = useToggleFinanceCategory();
    const deleteMutation = useDeleteFinanceCategory();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<FinancialTransactionType>('entrada');

    const handleCreate = async () => {
        if (!name.trim()) return;
        await createMutation.mutateAsync({ name: name.trim(), type });
        setName('');
        setDialogOpen(false);
    };

    return (
        <ClinicLayout>
            <div className="space-y-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer"
                            asChild
                        >
                            <Link to="/clinica/financas" aria-label="Voltar">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-semibold">Categorias</h1>
                    </div>
                    <Button
                        className="cursor-pointer"
                        onClick={() => setDialogOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nova categoria
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Origem</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-muted-foreground text-center"
                                    >
                                        Carregando…
                                    </TableCell>
                                </TableRow>
                            ) : categories.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-muted-foreground text-center"
                                    >
                                        Nenhuma categoria encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((cat) => (
                                    <TableRow key={cat.id}>
                                        <TableCell>{cat.name}</TableCell>
                                        <TableCell>
                                            {cat.type === 'entrada'
                                                ? 'Entrada'
                                                : 'Saída'}
                                        </TableCell>
                                        <TableCell>
                                            {cat.origin === 'system'
                                                ? 'Padrão'
                                                : 'Personalizada'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    cat.active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {cat.active
                                                    ? 'Ativa'
                                                    : 'Inativa'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                    onClick={() =>
                                                        toggleMutation.mutate(
                                                            cat.id,
                                                        )
                                                    }
                                                >
                                                    {cat.active
                                                        ? 'Desativar'
                                                        : 'Ativar'}
                                                </Button>
                                                {cat.origin === 'custom' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="cursor-pointer text-destructive"
                                                        onClick={() =>
                                                            deleteMutation.mutate(
                                                                cat.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova categoria</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Tipo</Label>
                            <Select
                                value={type}
                                onValueChange={(v) =>
                                    setType(v as FinancialTransactionType)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entrada">
                                        Entrada
                                    </SelectItem>
                                    <SelectItem value="saida">Saída</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="cursor-pointer"
                            onClick={handleCreate}
                            disabled={createMutation.isPending}
                        >
                            Criar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ClinicLayout>
    );
}
