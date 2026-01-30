import { Head, router, useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useCallback } from 'react';

import FlashMessage from '@/components/flash-message';
import InputError from '@/components/input-error';
import { Table } from '@/components/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Feature, type FeaturePlan, type Plan } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planos',
        href: '/admin/plans',
    },
    {
        title: 'Configurar Funcionalidades',
        href: '/admin/plans/configure-features',
    },
];

const VALUE_OPTIONS = [
    { value: 'true', label: 'Sim' },
    { value: 'false', label: 'Não' },
] as const;

interface ConfigureFeaturesProps {
    plans: Plan[];
    features: Feature[];
    featurePlans: FeaturePlan[];
}

export default function ConfigureFeatures({
    plans,
    features,
    featurePlans,
}: ConfigureFeaturesProps) {
    const { data, setData, post, processing, errors, clearErrors } =
        useForm({
            plan_id: '',
            feature_id: '',
            value: 'true',
        });

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            post('/admin/feature-plans', {
                onSuccess: () => {
                    setData((prev) => ({
                        ...prev,
                        plan_id: '',
                        feature_id: '',
                        value: 'true',
                    }));
                },
            });
        },
        [post, setData]
    );

    const handleRemove = useCallback((id: number) => {
        if (confirm('Remover esta configuração?')) {
            router.delete(`/admin/feature-plans/${id}`, {
                preserveScroll: true,
            });
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configurar Funcionalidades" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <FlashMessage />

                <div>
                    <h1 className="text-2xl font-bold">
                        Configurar Funcionalidades
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Configure as funcionalidades disponíveis para cada plano
                    </p>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="plan_id">
                                    Plano: <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.plan_id || undefined}
                                    onValueChange={(value) => {
                                        setData('plan_id', value);
                                        if (errors.plan_id) clearErrors('plan_id');
                                    }}
                                    required
                                >
                                    <SelectTrigger
                                        id="plan_id"
                                        className={errors.plan_id ? 'border-destructive' : ''}
                                    >
                                        <SelectValue placeholder="Selecione o plano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans.map((plan) => (
                                            <SelectItem
                                                key={plan.id}
                                                value={String(plan.id)}
                                            >
                                                {plan.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.plan_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="feature_id">
                                    Funcionalidade: <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.feature_id || undefined}
                                    onValueChange={(value) => {
                                        setData('feature_id', value);
                                        if (errors.feature_id) clearErrors('feature_id');
                                    }}
                                    required
                                >
                                    <SelectTrigger
                                        id="feature_id"
                                        className={errors.feature_id ? 'border-destructive' : ''}
                                    >
                                        <SelectValue placeholder="Selecione a funcionalidade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {features.map((feature) => (
                                            <SelectItem
                                                key={feature.id}
                                                value={String(feature.id)}
                                            >
                                                {feature.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.feature_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value">
                                    Valor: <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.value}
                                    onValueChange={(value) => {
                                        setData('value', value);
                                        if (errors.value) clearErrors('value');
                                    }}
                                    required
                                >
                                    <SelectTrigger
                                        id="value"
                                        className={errors.value ? 'border-destructive' : ''}
                                    >
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VALUE_OPTIONS.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.value} />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing}>
                                {processing && <Spinner className="mr-2 size-4" />}
                                Adicionar
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="flex-1">
                    <Table
                        columns={[
                            { title: 'Plano', key: 'plan' },
                            { title: 'Funcionalidade', key: 'feature' },
                            { title: 'Valor', key: 'value' },
                            { title: 'Ações', key: 'actions' },
                        ]}
                        data={featurePlans}
                        emptyMessage="Nenhuma configuração cadastrada. Adicione acima."
                    >
                        {(item) => (
                            <tr
                                key={item.id}
                                className="border-b border-sidebar-border/70 transition-colors hover:bg-accent/50"
                            >
                                <td className="px-4 py-3 text-sm font-medium">
                                    {item.plan?.name ?? '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {item.feature?.name ?? '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {item.value ? 'Sim' : 'Não'}
                                </td>
                                <td className="px-4 py-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => handleRemove(item.id)}
                                    >
                                        <Trash2 className="mr-1 size-4" />
                                        Excluir
                                    </Button>
                                </td>
                            </tr>
                        )}
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
