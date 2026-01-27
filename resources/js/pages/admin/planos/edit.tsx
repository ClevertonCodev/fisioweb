import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useCallback } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Plan } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planos',
        href: '/admin/planos/planos',
    },
    {
        title: 'Editar Plano',
        href: '/admin/planos/edit',
    },
];

interface EditPlanoProps {
    plan: Plan;
}

export default function EditPlano({ plan }: EditPlanoProps) {
    const { data, setData, put, processing, errors, clearErrors } = useForm({
        name: plan.name || '',
        type_charge: plan.type_charge || '',
        value_month: String(plan.value_month || ''),
        value_year: String(plan.value_year || ''),
    });

    const handleCancel = useCallback(() => {
        router.visit('/admin/planos/planos');
    }, []);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();

            put(`/admin/planos/${plan.id}`, {
                onSuccess: () => {
                    router.visit('/admin/planos/planos');
                },
            });
        },
        [put, plan.id]
    );

    const handleValueChange = (field: 'value_month' | 'value_year', value: string) => {
        const numbers = value.replace(/\D/g, '');
        const valueInCents = parseInt(numbers) || 0;
        const formattedValue = (valueInCents / 100).toFixed(2);
        setData(field, formattedValue);
        if (errors[field]) clearErrors(field);
    };

    const formatDisplayValue = (value: string) => {
        if (!value) return '';
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return '';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
        }).format(numValue);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Editar Plano" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Cabeçalho */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancel}
                        className="shrink-0"
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Editar Plano</h1>
                </div>

                {/* Formulário */}
                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nome do Plano <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => {
                                        setData('name', e.target.value);
                                        if (errors.name) clearErrors('name');
                                    }}
                                    required
                                    autoFocus
                                    placeholder="Digite o nome do plano"
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type_charge">
                                    Tipo de Cobrança <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.type_charge}
                                    onValueChange={(value) => {
                                        setData('type_charge', value);
                                        if (errors.type_charge) clearErrors('type_charge');
                                    }}
                                    required
                                >
                                    <SelectTrigger
                                        id="type_charge"
                                        className={errors.type_charge ? 'border-destructive' : ''}
                                    >
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="por_usuario">
                                            Por Usuário
                                        </SelectItem>
                                        <SelectItem value="fixo">Fixo</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type_charge} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value_month">
                                    Valor Mensal <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="value_month"
                                    name="value_month"
                                    type="text"
                                    value={formatDisplayValue(data.value_month)}
                                    onChange={(e) => {
                                        handleValueChange('value_month', e.target.value);
                                    }}
                                    required
                                    placeholder="R$ 0,00"
                                    className={errors.value_month ? 'border-destructive' : ''}
                                />
                                <InputError message={errors.value_month} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value_year">
                                    Valor Anual <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="value_year"
                                    name="value_year"
                                    type="text"
                                    value={formatDisplayValue(data.value_year)}
                                    onChange={(e) => {
                                        handleValueChange('value_year', e.target.value);
                                    }}
                                    required
                                    placeholder="R$ 0,00"
                                    className={errors.value_year ? 'border-destructive' : ''}
                                />
                                <InputError message={errors.value_year} />
                            </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center justify-end gap-4 border-t border-sidebar-border/70 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={processing}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing && <Spinner className="mr-2" />}
                                Atualizar Plano
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
