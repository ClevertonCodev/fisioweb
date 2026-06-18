import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';
import { toast } from 'sonner';

import {
    useCreateFeaturePlan,
    useDeleteFeaturePlan,
} from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Feature, FeaturePlan, Plan } from '@/domain/admin';

const DEFAULT_PAGE_SIZE = 10;

const featurePlanColumns = [
    { title: 'Plano', key: 'plan' },
    { title: 'Funcionalidade', key: 'feature' },
    { title: 'Valor', key: 'value' },
    { title: 'Ações', key: 'actions', className: 'w-20 text-center' },
];

export interface ConfigureFeaturesLoaderData {
    featurePlans: FeaturePlan[];
    plans: Plan[];
    features: Feature[];
    error: string | null;
}

export default function ConfigureFeaturesPage() {
    const navigate = useNavigate();
    const revalidator = useRevalidator();
    const { featurePlans, plans, features, error } =
        useLoaderData() as ConfigureFeaturesLoaderData;

    const [form, setForm] = useState({
        plan_id: '',
        feature_id: '',
        value: 'true',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const totalPages = Math.max(1, Math.ceil(featurePlans.length / pageSize));
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return featurePlans.slice(start, start + pageSize);
    }, [featurePlans, currentPage, pageSize]);

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };
    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const createMutation = useCreateFeaturePlan({
        onSuccess: () => revalidator.revalidate(),
    });
    const deleteMutation = useDeleteFeaturePlan({
        onSuccess: () => revalidator.revalidate(),
    });

    const handleAdd = () => {
        const planId = Number(form.plan_id);
        const featureId = Number(form.feature_id);
        if (!planId || !featureId) return;

        const exists = featurePlans.some(
            (fp) => fp.plan_id === planId && fp.feature_id === featureId,
        );
        if (exists) {
            toast.warning(
                'Esta funcionalidade já está configurada para este plano.',
            );
            return;
        }

        createMutation.mutate(
            {
                planId,
                featureId,
                value: form.value === 'true',
            },
            {
                onSuccess: () =>
                    setForm({ plan_id: '', feature_id: '', value: 'true' }),
            },
        );
    };

    const handleRemove = (id: number) => {
        deleteMutation.mutate(id);
    };

    const getPlanName = (id: number) =>
        plans.find((p) => p.id === id)?.name ?? '—';
    const getFeatureName = (id: number) =>
        features.find((f) => f.id === id)?.name ?? '—';

    const isFormValid = form.plan_id && form.feature_id;

    return (
        <AdminLayout>
            <div className="space-y-6 p-4 md:p-6">
                {error && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <div className="text-sm text-muted-foreground">
                    <span
                        className="cursor-pointer hover:underline"
                        onClick={() => navigate('/admin/planos')}
                    >
                        Planos
                    </span>
                    {' > '}
                    <span className="text-foreground">
                        Configurar Funcionalidades
                    </span>
                </div>

                <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Configurar Funcionalidades
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Vincule várias funcionalidades a vários planos: cada
                        plano pode ter diversas funcionalidades (Sim/Não).
                        Adicione uma associação por vez; a mesma combinação
                        plano + funcionalidade não pode ser duplicada.
                    </p>
                </div>

                {plans.length === 0 || features.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="mb-4 text-muted-foreground">
                                {plans.length === 0 && features.length === 0
                                    ? 'Cadastre ao menos um plano e uma funcionalidade para configurar vínculos.'
                                    : plans.length === 0
                                      ? 'Cadastre ao menos um plano para configurar funcionalidades.'
                                      : 'Cadastre ao menos uma funcionalidade para configurar planos.'}
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {plans.length === 0 && (
                                    <Button
                                        onClick={() =>
                                            navigate('/admin/planos/novo')
                                        }
                                    >
                                        Cadastrar plano
                                    </Button>
                                )}
                                {features.length === 0 && (
                                    <Button
                                        variant={
                                            plans.length === 0
                                                ? 'outline'
                                                : 'default'
                                        }
                                        onClick={() =>
                                            navigate(
                                                '/admin/funcionalidades/nova',
                                            )
                                        }
                                    >
                                        Cadastrar funcionalidade
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/admin/planos')}
                                >
                                    Ver planos
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card>
                            <CardContent className="space-y-4 p-4">
                                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <Label>
                                            Plano:{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={form.plan_id}
                                            onValueChange={(v) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    plan_id: v,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o plano" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {plans.map((p) => (
                                                    <SelectItem
                                                        key={p.id}
                                                        value={String(p.id)}
                                                    >
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>
                                            Funcionalidade:{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={form.feature_id}
                                            onValueChange={(v) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    feature_id: v,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a funcionalidade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {features.map((f) => (
                                                    <SelectItem
                                                        key={f.id}
                                                        value={String(f.id)}
                                                    >
                                                        {f.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>
                                            Valor:{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={form.value}
                                            onValueChange={(v) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    value: v,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="true">
                                                    Sim
                                                </SelectItem>
                                                <SelectItem value="false">
                                                    Não
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleAdd}
                                        disabled={
                                            !isFormValid ||
                                            createMutation.isPending
                                        }
                                    >
                                        {createMutation.isPending
                                            ? 'Adicionando…'
                                            : 'Adicionar vínculo'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <DataTable<FeaturePlan>
                            columns={featurePlanColumns}
                            data={paginatedData}
                            totalLabel="configurações"
                            totalCount={featurePlans.length}
                            emptyMessage="Nenhuma configuração cadastrada. Selecione plano e funcionalidade e clique em Adicionar."
                            pagination={{
                                currentPage,
                                totalPages,
                                onPageChange: handlePageChange,
                            }}
                            pageSize={pageSize}
                            onPageSizeChange={handlePageSizeChange}
                        >
                            {(item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {getPlanName(item.plan_id)}
                                    </TableCell>
                                    <TableCell className="text-primary">
                                        {getFeatureName(item.feature_id)}
                                    </TableCell>
                                    <TableCell>
                                        {item.value ? 'Sim' : 'Não'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 cursor-pointer text-destructive/70 hover:text-destructive"
                                                        onClick={() =>
                                                            handleRemove(
                                                                item.id,
                                                            )
                                                        }
                                                        disabled={
                                                            deleteMutation.isPending &&
                                                            deleteMutation.variables ===
                                                                item.id
                                                        }
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
                            )}
                        </DataTable>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
