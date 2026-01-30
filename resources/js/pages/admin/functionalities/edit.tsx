import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useCallback } from 'react';

import InputError from '@/components/input-error';
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
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Feature } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Funcionalidades',
        href: '/admin/functionalities',
    },
    {
        title: 'Editar Funcionalidade',
        href: '/admin/functionalities/edit',
    },
];

interface EditFunctionalityProps {
    functionality: Feature;
    allowedKeys: Record<string, string>;
    types: Record<string, string>;
}

export default function EditFunctionality({
    functionality,
    allowedKeys,
    types,
}: EditFunctionalityProps) {
    const { data, setData, put, processing, errors, clearErrors } = useForm({
        key: functionality.key || '',
        name: functionality.name || '',
        value_isolated: functionality.value_isolated
            ? String(functionality.value_isolated)
            : '',
        type: functionality.type || '',
    });

    const handleCancel = useCallback(() => {
        router.visit('/admin/functionalities');
    }, []);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            put(`/admin/functionalities/${functionality.id}`, {
                onSuccess: () => {
                    router.visit('/admin/functionalities');
                },
            });
        },
        [put, functionality.id]
    );

    const handleValueIsolatedChange = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        const valueInCents = parseInt(numbers) || 0;
        const formattedValue = (valueInCents / 100).toFixed(2);
        setData('value_isolated', formattedValue);
        if (errors.value_isolated) clearErrors('value_isolated');
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
            <Head title="Editar Funcionalidade" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancel}
                        className="shrink-0"
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Editar Funcionalidade</h1>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="key">Chave</Label>
                                <Input
                                    id="key"
                                    name="key"
                                    type="text"
                                    value={data.key}
                                    readOnly
                                    disabled
                                    className="bg-muted cursor-not-allowed font-mono"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {allowedKeys[data.key]
                                        ? allowedKeys[data.key]
                                        : 'Chave definida no sistema (não editável)'}
                                </p>
                                <InputError message={errors.key} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nome <span className="text-destructive">*</span>
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
                                    placeholder="Nome da funcionalidade"
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value_isolated">Valor Isolado</Label>
                                <Input
                                    id="value_isolated"
                                    name="value_isolated"
                                    type="text"
                                    value={formatDisplayValue(String(data.value_isolated || ''))}
                                    onChange={(e) => {
                                        handleValueIsolatedChange(e.target.value);
                                    }}
                                    placeholder="R$ 0,00"
                                    className={
                                        errors.value_isolated ? 'border-destructive' : ''
                                    }
                                />
                                <InputError message={errors.value_isolated} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">
                                    Tipo <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.type || undefined}
                                    onValueChange={(value) => {
                                        setData('type', value);
                                        if (errors.type) clearErrors('type');
                                    }}
                                    required
                                >
                                    <SelectTrigger
                                        id="type"
                                        className={errors.type ? 'border-destructive' : ''}
                                    >
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(types).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>
                        </div>

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
                                Atualizar Funcionalidade
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
