import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useClinic, usePlansOptions, useUpdateClinic } from '@/application/admin';
import { editClinicFormSchema, type EditClinicFormValues } from '@/application/admin/clinic-schema';
import { AdminLayout } from '@/components/admin/AdminLayout';
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
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
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
import type { Clinic } from '@/domain/admin';

// ─── Shell (loading / erro) ───────────────────────────────────────────────────

export default function ClinicEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const clinicId = id ? parseInt(id, 10) : undefined;
    const validId = clinicId != null && !isNaN(clinicId) ? clinicId : undefined;

    const { data: clinic, isLoading, error } = useClinic(validId);

    if (validId == null) {
        navigate('/admin/clinicas');
        return null;
    }

    if (isLoading || (!clinic && !error)) {
        return (
            <AdminLayout>
                <div className="p-6">Carregando...</div>
            </AdminLayout>
        );
    }
    if (error || !clinic) {
        toast.error('Clínica não encontrada.');
        navigate('/admin/clinicas');
        return null;
    }

    return <EditClinicForm clinic={clinic} clinicId={validId} />;
}

// ─── Formulário (monta somente com dados disponíveis) ─────────────────────────

function EditClinicForm({ clinic, clinicId }: { clinic: Clinic; clinicId: number }) {
    const navigate = useNavigate();
    const { data: plansOptions = [] } = usePlansOptions();

    const form = useForm<EditClinicFormValues>({
        resolver: zodResolver(editClinicFormSchema),
        mode: 'onTouched',
        defaultValues: {
            name: clinic.name,
            typePerson: clinic.typePerson,
            // garante dígitos puros caso a API devolva documento formatado
            document: clinic.document.replace(/\D/g, ''),
            email: clinic.email,
            phone: clinic.phone ?? '',
            status: String(clinic.status),
            slug: clinic.slug ?? '',
            planId: clinic.planId != null ? String(clinic.planId) : '',
            zipCode: clinic.zipCode ?? '',
            address: clinic.address ?? '',
            number: clinic.number ?? '',
            city: clinic.city ?? '',
            state: clinic.state ?? '',
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

    const updateMutation = useUpdateClinic(clinicId, {
        onSuccess: () => navigate('/admin/clinicas'),
    });

    const handleSubmit = form.handleSubmit((values) => {
        updateMutation.mutate({
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
                <header className="bg-background/95 border-border sticky top-0 z-10 border-b backdrop-blur">
                    <div className="space-y-3 px-6 py-4">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link to="/admin/clinicas">Clínicas</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Editar Clínica</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h1 className="text-foreground text-2xl font-semibold">
                                Editar Clínica
                            </h1>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <Form {...form}>
                        <form onSubmit={handleSubmit}>
                            <Card className="mx-auto max-w-4xl">
                                <CardContent className="space-y-8 p-6">
                                    <section className="space-y-4">
                                        <h2 className="text-foreground border-border border-b pb-2 text-lg font-semibold">
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
                                                            <Input {...field} />
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
                                                            onValueChange={(v) => {
                                                                field.onChange(v);
                                                                form.setValue('document', '', {
                                                                    shouldValidate: false,
                                                                });
                                                            }}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="PF">
                                                                    Pessoa Física
                                                                </SelectItem>
                                                                <SelectItem value="PJ">
                                                                    Pessoa Jurídica
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
                                                                    watchedType === 'PJ'
                                                                        ? 'cnpj'
                                                                        : 'cpf'
                                                                }
                                                                value={field.value}
                                                                onChange={(raw) =>
                                                                    field.onChange(raw)
                                                                }
                                                                onBlur={field.onBlur}
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
                                                            <Input type="email" {...field} />
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
                                                                value={field.value ?? ''}
                                                                onChange={(raw) =>
                                                                    field.onChange(raw)
                                                                }
                                                                onBlur={field.onBlur}
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
                                                            onValueChange={field.onChange}
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
                                                                <SelectItem value="-1">
                                                                    Cancelado
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Slug */}
                                        <div>
                                            <SlugInput
                                                value={watchedSlug}
                                                onChange={(slug) =>
                                                    form.setValue('slug', slug, {
                                                        shouldValidate:
                                                            form.formState.touchedFields.slug,
                                                    })
                                                }
                                                baseName={watchedName}
                                                required
                                            />
                                            {form.formState.touchedFields.slug &&
                                                form.formState.errors.slug && (
                                                    <p className="text-destructive mt-1 text-[11px] font-medium">
                                                        {form.formState.errors.slug.message}
                                                    </p>
                                                )}
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h2 className="text-foreground border-border border-b pb-2 text-lg font-semibold">
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
                                                            value={field.value || undefined}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione um plano (opcional)" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {plansOptions.map((p) => (
                                                                    <SelectItem
                                                                        key={p.id}
                                                                        value={String(p.id)}
                                                                    >
                                                                        {p.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h2 className="text-foreground border-border border-b pb-2 text-lg font-semibold">
                                            Endereço
                                        </h2>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label className="text-foreground">CEP</Label>
                                                <Input
                                                    placeholder="00000-000"
                                                    {...form.register('zipCode')}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-foreground">Endereço</Label>
                                                <Input
                                                    placeholder="Rua, avenida, etc."
                                                    {...form.register('address')}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-foreground">Número</Label>
                                                <Input
                                                    placeholder="Número"
                                                    {...form.register('number')}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-foreground">Cidade</Label>
                                                <Input
                                                    placeholder="Nome da cidade"
                                                    {...form.register('city')}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-foreground">Estado</Label>
                                                <Input
                                                    placeholder="UF"
                                                    maxLength={2}
                                                    {...form.register('state')}
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    <div className="border-border flex justify-end gap-3 border-t pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => navigate(-1)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={!isFormReady || updateMutation.isPending}
                                        >
                                            Salvar alterações
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
