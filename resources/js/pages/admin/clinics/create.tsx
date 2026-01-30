import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';

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
import { generateSlug, maskCnpj, maskCpf, validateCnpj, validateCpf } from '@/lib/validators';
import { type BreadcrumbItem, type Plan } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Clinicas',
        href: '/admin/clinics',
    },
    {
        title: 'Nova Clínica',
        href: '/admin/clinics/create',
    },
];

interface CreateClinicProps {
    plans: Plan[];
}

export default function CreateClinic({ plans }: CreateClinicProps) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        document: '',
        type_person: '',
        status: '1',
        email: '',
        phone: '',
        slug: '',
        zip_code: '',
        address: '',
        number: '',
        city: '',
        state: '',
        plan_id: '',
    });

    const isSlugEditable = !!errors.slug;
    const documentError = useMemo(() => {
        if (!data.document || !data.type_person) return '';
        const isValid =
            data.type_person === 'fisica'
                ? validateCpf(data.document)
                : validateCnpj(data.document);
        if (!isValid) {
            return data.type_person === 'fisica' ? 'CPF inválido' : 'CNPJ inválido';
        }
        return '';
    }, [data.document, data.type_person]);

    useEffect(() => {
        if (data.name && !isSlugEditable) {
            setData('slug', generateSlug(data.name));
        } else if (!data.name && !isSlugEditable) {
            setData('slug', '');
        }
    }, [data.name, isSlugEditable, setData]);

    const handleCancel = useCallback(() => {
        router.visit('/admin/clinics');
    }, []);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();

            if (data.document && data.type_person) {
                const isValid =
                    data.type_person === 'fisica'
                        ? validateCpf(data.document)
                        : validateCnpj(data.document);

                if (!isValid) {
                    setDocumentError(
                        data.type_person === 'fisica'
                            ? 'CPF inválido'
                            : 'CNPJ inválido'
                    );
                    return;
                }
            }

            post('/admin/clinics', {
                onSuccess: () => {
                    reset();
                },
            });
        },
        [data.document, data.type_person, post, reset]
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Clinic" />
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
                    <h1 className="text-2xl font-bold">Nova Clínica</h1>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">
                                Informações Básicas
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nome da Clínica <span className="text-destructive">*</span>
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
                                        placeholder="Digite o nome da clínica"
                                        className={errors.name ? 'border-destructive' : ''}
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type_person">
                                        Tipo de Pessoa <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={data.type_person}
                                        onValueChange={(value) => {
                                            setData('type_person', value);
                                            if (errors.type_person) clearErrors('type_person');
                                            if (errors.document) clearErrors('document');
                                            setDocumentError('');
                                        }}
                                        required
                                    >
                                        <SelectTrigger
                                            id="type_person"
                                            className={errors.type_person ? 'border-destructive' : ''}
                                        >
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fisica">
                                                Pessoa Física
                                            </SelectItem>
                                            <SelectItem value="juridica">
                                                Pessoa Jurídica
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type_person} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="document">
                                        {data.type_person === 'fisica'
                                            ? 'CPF'
                                            : data.type_person === 'juridica'
                                                ? 'CNPJ'
                                                : 'CPF/CNPJ'}{' '}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="document"
                                        name="document"
                                        type="text"
                                        value={data.document}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (data.type_person === 'fisica') {
                                                setData('document', maskCpf(value));
                                            } else if (data.type_person === 'juridica') {
                                                setData('document', maskCnpj(value));
                                            } else {
                                                setData('document', value);
                                            }
                                            if (errors.document) clearErrors('document');
                                            setDocumentError('');
                                        }}
                                        required
                                        disabled={!data.type_person}
                                        placeholder={
                                            !data.type_person
                                                ? 'Selecione o tipo de pessoa primeiro'
                                                : data.type_person === 'fisica'
                                                    ? '000.000.000-00'
                                                    : data.type_person === 'juridica'
                                                        ? '00.000.000/0000-00'
                                                        : 'Digite o CPF ou CNPJ'
                                        }
                                        maxLength={
                                            data.type_person === 'fisica'
                                                ? 14
                                                : data.type_person === 'juridica'
                                                    ? 18
                                                    : undefined
                                        }
                                        className={
                                            errors.document || documentError
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    />
                                    <InputError
                                        message={errors.document || documentError}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        E-mail <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => {
                                            setData('email', e.target.value);
                                            if (errors.email) clearErrors('email');
                                        }}
                                        required
                                        placeholder="email@exemplo.com"
                                        className={errors.email ? 'border-destructive' : ''}
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => {
                                            setData('phone', e.target.value);
                                            if (errors.phone) clearErrors('phone');
                                        }}
                                        placeholder="(00) 00000-0000"
                                        className={errors.phone ? 'border-destructive' : ''}
                                    />
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">
                                        Status <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) => {
                                            setData('status', value);
                                            if (errors.status) clearErrors('status');
                                        }}
                                        required
                                    >
                                        <SelectTrigger
                                            id="status"
                                            className={errors.status ? 'border-destructive' : ''}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Ativo</SelectItem>
                                            <SelectItem value="0">Inativo</SelectItem>
                                            <SelectItem value="-1">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="slug">
                                            Url{' '}
                                            {!isSlugEditable && (
                                                <span className="text-muted-foreground text-xs">
                                                    (gerado automaticamente)
                                                </span>
                                            )}
                                            {isSlugEditable && (
                                                <span className="text-destructive text-xs">*</span>
                                            )}
                                        </Label>
                                        {!isSlugEditable && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsSlugEditable(true)}
                                                className="h-8"
                                            >
                                                <Pencil className="mr-2 size-3" />
                                                Editar
                                            </Button>
                                        )}
                                    </div>
                                    <Input
                                        id="slug"
                                        name="slug"
                                        type="text"
                                        value={data.slug}
                                        onChange={(e) => {
                                            if (isSlugEditable) {
                                                setData('slug', e.target.value);
                                            } else {
                                                setData('slug', generateSlug(e.target.value));
                                            }
                                            if (errors.slug) clearErrors('slug');
                                        }}
                                        readOnly={!isSlugEditable}
                                        required={isSlugEditable}
                                        placeholder={
                                            isSlugEditable
                                                ? 'Digite o slug'
                                                : 'O slug será gerado automaticamente'
                                        }
                                        className={
                                            isSlugEditable
                                                ? errors.slug
                                                    ? 'border-destructive'
                                                    : ''
                                                : 'bg-muted cursor-not-allowed'
                                        }
                                    />
                                    {!isSlugEditable && (
                                        <p className="text-xs text-muted-foreground">
                                            URL amigável gerada automaticamente a partir do nome
                                        </p>
                                    )}
                                    {isSlugEditable && errors.slug && (
                                        <p className="text-xs text-destructive">
                                            Este slug já está em uso. Por favor, escolha outro.
                                        </p>
                                    )}
                                    <InputError message={errors.slug} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Plano</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="plan_id">Plano</Label>
                                    <Select
                                        value={data.plan_id || undefined}
                                        onValueChange={(value) => {
                                            setData('plan_id', value);
                                            if (errors.plan_id) clearErrors('plan_id');
                                        }}
                                    >
                                        <SelectTrigger
                                            id="plan_id"
                                            className={errors.plan_id ? 'border-destructive' : ''}
                                        >
                                            <SelectValue placeholder="Selecione um plano (opcional)" />
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
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Endereço</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="zip_code">CEP</Label>
                                    <Input
                                        id="zip_code"
                                        name="zip_code"
                                        type="text"
                                        value={data.zip_code}
                                        onChange={(e) => {
                                            setData('zip_code', e.target.value);
                                            if (errors.zip_code) clearErrors('zip_code');
                                        }}
                                        placeholder="00000-000"
                                        className={errors.zip_code ? 'border-destructive' : ''}
                                    />
                                    <InputError message={errors.zip_code} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Endereço</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        type="text"
                                        value={data.address}
                                        onChange={(e) => {
                                            setData('address', e.target.value);
                                            if (errors.address) clearErrors('address');
                                        }}
                                        placeholder="Rua, avenida, etc."
                                        className={errors.address ? 'border-destructive' : ''}
                                    />
                                    <InputError message={errors.address} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="number">Número</Label>
                                    <Input
                                        id="number"
                                        name="number"
                                        type="text"
                                        value={data.number}
                                        onChange={(e) => {
                                            setData('number', e.target.value);
                                            if (errors.number) clearErrors('number');
                                        }}
                                        placeholder="Número"
                                        className={errors.number ? 'border-destructive' : ''}
                                    />
                                    <InputError message={errors.number} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">Cidade</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        type="text"
                                        value={data.city}
                                        onChange={(e) => {
                                            setData('city', e.target.value);
                                            if (errors.city) clearErrors('city');
                                        }}
                                        placeholder="Nome da cidade"
                                        className={errors.city ? 'border-destructive' : ''}
                                    />
                                    <InputError message={errors.city} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">Estado</Label>
                                    <Input
                                        id="state"
                                        name="state"
                                        type="text"
                                        value={data.state}
                                        onChange={(e) => {
                                            setData('state', e.target.value);
                                            if (errors.state) clearErrors('state');
                                        }}
                                        placeholder="UF"
                                        maxLength={2}
                                        className={errors.state ? 'border-destructive' : ''}
                                    />
                                    <InputError message={errors.state} />
                                </div>
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
                                Salvar Clínica
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
