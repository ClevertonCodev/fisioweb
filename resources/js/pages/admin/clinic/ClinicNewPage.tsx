import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { useCreateClinic, usePlansOptions } from '@/application/admin';
import {
    clinicFormSchema,
    type ClinicFormValues,
} from '@/application/admin/clinic-schema';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BackButton } from '@/components/ui/back-button';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CpfCnpjInput } from '@/components/ui/cpf-cnpj-input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SlugInput } from '@/components/ui/slug-input';

export default function ClinicNewPage() {
    const navigate = useNavigate();
    const { data: plansOptions = [] } = usePlansOptions();

    const form = useForm<ClinicFormValues>({
        resolver: zodResolver(clinicFormSchema),
        mode: 'onTouched',
        defaultValues: {
            name: '',
            typePerson: undefined,
            document: '',
            email: '',
            phone: '',
            status: '1',
            slug: '',
            planId: '',
            zipCode: '',
            address: '',
            number: '',
            city: '',
            state: '',
        },
    });

    const watchedType = useWatch({ control: form.control, name: 'typePerson' });
    const watchedName = useWatch({ control: form.control, name: 'name' });
    const watchedDoc = useWatch({ control: form.control, name: 'document' });
    const watchedEmail = useWatch({ control: form.control, name: 'email' });
    const watchedSlug = useWatch({ control: form.control, name: 'slug' });

    const requiredDocLen = watchedType === 'PJ' ? 14 : 11;
    const isFormReady = Boolean(
        watchedName?.trim() &&
        watchedType &&
        watchedDoc?.length === requiredDocLen &&
        watchedEmail?.trim() &&
        watchedSlug?.trim(),
    );

    const createMutation = useCreateClinic({
        onSuccess: () => navigate('/admin/clinicas'),
    });

    const handleSubmit = form.handleSubmit((values) => {
        createMutation.mutate({
            name: values.name,
            typePerson: values.typePerson,
            document: values.document,
            email: values.email,
            phone: values.phone || null,
            status: parseInt(values.status, 10),
            slug: values.slug || null,
            planId: values.planId ? parseInt(values.planId, 10) : null,
            zipCode: values.zipCode || null,
            address: values.address || null,
            number: values.number || null,
            city: values.city || null,
            state: values.state || null,
        });
    });

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="space-y-3 px-6 py-4">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link to="/admin/clinicas">
                                            Clínicas
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        Nova Clínica
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex items-center justify-between gap-3">
                            <h1 className="text-2xl font-semibold text-foreground">
                                Nova Clínica
                            </h1>
                            <BackButton onClick={() => navigate(-1)} />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <Form {...form}>
                        <form onSubmit={handleSubmit}>
                            <Card className="mx-auto max-w-4xl">
                                <CardContent className="space-y-8 p-6">
                                    {/* Informações Básicas */}
                                    <section className="space-y-4">
                                        <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
                                            Informações Básicas
                                        </h2>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {/* Nome */}
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-foreground">
                                                            Nome da Clínica{' '}
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </Label>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Digite o nome da clínica"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Tipo de Pessoa */}
                                            <FormField
                                                control={form.control}
                                                name="typePerson"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-foreground">
                                                            Tipo de Pessoa{' '}
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </Label>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={(
                                                                v,
                                                            ) => {
                                                                field.onChange(
                                                                    v,
                                                                );
                                                                // limpa documento ao trocar tipo
                                                                form.setValue(
                                                                    'document',
                                                                    '',
                                                                    {
                                                                        shouldValidate: false,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione o tipo" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="PF">
                                                                    Pessoa
                                                                    Física
                                                                </SelectItem>
                                                                <SelectItem value="PJ">
                                                                    Pessoa
                                                                    Jurídica
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* CPF/CNPJ */}
                                            <FormField
                                                control={form.control}
                                                name="document"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-foreground">
                                                            CPF/CNPJ{' '}
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </Label>
                                                        <FormControl>
                                                            <CpfCnpjInput
                                                                type={
                                                                    watchedType ===
                                                                    'PJ'
                                                                        ? 'cnpj'
                                                                        : 'cpf'
                                                                }
                                                                value={
                                                                    field.value
                                                                }
                                                                onChange={(
                                                                    raw,
                                                                ) =>
                                                                    field.onChange(
                                                                        raw,
                                                                    )
                                                                }
                                                                onBlur={
                                                                    field.onBlur
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* E-mail */}
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-foreground">
                                                            E-mail{' '}
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </Label>
                                                        <FormControl>
                                                            <Input
                                                                type="email"
                                                                placeholder="email@exemplo.com"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Telefone */}
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-foreground">
                                                            Telefone
                                                        </Label>
                                                        <FormControl>
                                                            <PhoneInput
                                                                value={
                                                                    field.value ??
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    raw,
                                                                ) =>
                                                                    field.onChange(
                                                                        raw,
                                                                    )
                                                                }
                                                                onBlur={
                                                                    field.onBlur
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Status */}
                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-foreground">
                                                            Status{' '}
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </Label>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="1">
                                                                    Ativo
                                                                </SelectItem>
                                                                <SelectItem value="0">
                                                                    Inativo
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Slug — componente composto, sincronizado via setValue/watch */}
                                        <div>
                                            <SlugInput
                                                value={watchedSlug}
                                                onChange={(slug) =>
                                                    form.setValue(
                                                        'slug',
                                                        slug,
                                                        {
                                                            shouldValidate:
                                                                form.formState
                                                                    .touchedFields
                                                                    .slug,
                                                        },
                                                    )
                                                }
                                                baseName={watchedName}
                                                required
                                            />
                                            {form.formState.touchedFields
                                                .slug &&
                                                form.formState.errors.slug && (
                                                    <p className="mt-1 text-[11px] font-medium text-destructive">
                                                        {
                                                            form.formState
                                                                .errors.slug
                                                                .message
                                                        }
                                                    </p>
                                                )}
                                        </div>
                                    </section>

                                    {/* Plano */}
                                    <section className="space-y-4">
                                        <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
                                            Plano
                                        </h2>
                                        <div className="max-w-md">
                                            <FormField
                                                control={form.control}
                                                name="planId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label className="text-foreground">
                                                            Plano
                                                        </Label>
                                                        <Select
                                                            value={
                                                                field.value ||
                                                                undefined
                                                            }
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione um plano (opcional)" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {plansOptions.map(
                                                                    (p) => (
                                                                        <SelectItem
                                                                            key={
                                                                                p.id
                                                                            }
                                                                            value={String(
                                                                                p.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                p.name
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </section>

                                    {/* Endereço */}
                                    <section className="space-y-4">
                                        <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
                                            Endereço
                                        </h2>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label className="text-foreground">
                                                    CEP
                                                </Label>
                                                <Input
                                                    placeholder="00000-000"
                                                    {...form.register(
                                                        'zipCode',
                                                    )}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-foreground">
                                                    Endereço
                                                </Label>
                                                <Input
                                                    placeholder="Rua, avenida, etc."
                                                    {...form.register(
                                                        'address',
                                                    )}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-foreground">
                                                    Número
                                                </Label>
                                                <Input
                                                    placeholder="Número"
                                                    {...form.register('number')}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-foreground">
                                                    Cidade
                                                </Label>
                                                <Input
                                                    placeholder="Nome da cidade"
                                                    {...form.register('city')}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-foreground">
                                                    Estado
                                                </Label>
                                                <Input
                                                    placeholder="UF"
                                                    maxLength={2}
                                                    {...form.register('state')}
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 border-t border-border pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => navigate(-1)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={
                                                !isFormReady ||
                                                createMutation.isPending
                                            }
                                        >
                                            Salvar Clínica
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </Form>
                </div>
            </div>
        </AdminLayout>
    );
}
