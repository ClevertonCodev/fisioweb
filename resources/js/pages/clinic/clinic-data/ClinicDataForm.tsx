import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import {
    clinicProfileFormSchema,
    clinicProfileFormToUpdateDto,
    clinicProfileToFormValues,
    type ClinicProfileFormValues,
} from '@/application/clinic/clinic-profile-form';
import { can } from '@/application/clinic/permissions';
import {
    useClinicProfile,
    useUpdateClinicProfile,
} from '@/application/clinic/use-clinic-profile';
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
import { Skeleton } from '@/components/ui/skeleton';
import { SlugInput } from '@/components/ui/slug-input';
import { useAuth } from '@/contexts/AuthContext';

export function ClinicDataForm() {
    const { user } = useAuth();
    const canEdit = can.editClinicData(user?.mestre);
    const { data: profile, isLoading, isError } = useClinicProfile();
    const updateProfile = useUpdateClinicProfile();

    const form = useForm<ClinicProfileFormValues>({
        resolver: zodResolver(clinicProfileFormSchema),
        mode: 'onTouched',
        defaultValues: {
            name: '',
            typePerson: 'PJ',
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

    useEffect(() => {
        if (profile) {
            form.reset(clinicProfileToFormValues(profile));
        }
    }, [profile, form]);

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
            watchedEmail?.trim(),
    );

    const onSubmit = (values: ClinicProfileFormValues) => {
        updateProfile.mutate(clinicProfileFormToUpdateDto(values));
    };

    const handleCancel = () => {
        if (profile) {
            form.reset(clinicProfileToFormValues(profile));
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <Skeleton className="mb-6 h-9 w-64" />
                <Card className="mx-auto max-w-4xl">
                    <CardContent className="space-y-4 p-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isError || !profile) {
        return (
            <div className="text-destructive p-6">
                Não foi possível carregar os dados da clínica.
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <header className="bg-background/95 border-border sticky top-0 z-10 border-b backdrop-blur">
                <div className="space-y-1 px-6 py-4">
                    <h1 className="text-foreground text-2xl font-semibold">
                        Dados da clínica
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        ID da clínica: {profile.id}
                        {!canEdit && (
                            <span className="text-muted-foreground ml-2">
                                · Somente visualização (apenas o usuário mestre pode
                                editar)
                            </span>
                        )}
                    </p>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <Card className="mx-auto max-w-4xl">
                            <CardContent className="space-y-8 p-6">
                                <section className="space-y-4">
                                    <h2 className="text-foreground border-border border-b pb-2 text-lg font-semibold">
                                        Informações Básicas
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                                            {...field}
                                                            disabled={!canEdit}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

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
                                                            if (canEdit) {
                                                                form.setValue(
                                                                    'document',
                                                                    '',
                                                                    {
                                                                        shouldValidate: false,
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                        disabled={!canEdit}
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
                                                            disabled={!canEdit}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

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
                                                            {...field}
                                                            disabled={!canEdit}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

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
                                                            disabled={!canEdit}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

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
                                                        disabled={!canEdit}
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

                                    <div>
                                        <SlugInput
                                            value={watchedSlug}
                                            onChange={(slug) =>
                                                form.setValue('slug', slug, {
                                                    shouldValidate: false,
                                                })
                                            }
                                            required
                                            readOnly
                                        />
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            A URL da clínica só pode ser alterada pelo suporte
                                            do sistema.
                                        </p>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h2 className="text-foreground border-border border-b pb-2 text-lg font-semibold">
                                        Plano
                                    </h2>
                                    <div className="max-w-md">
                                        <div className="space-y-1.5">
                                            <Label className="text-foreground">Plano</Label>
                                            <Input
                                                value={
                                                    profile.planName ??
                                                    'Nenhum plano associado'
                                                }
                                                disabled
                                                readOnly
                                                className="bg-muted/50"
                                            />
                                            <p className="text-muted-foreground text-xs">
                                                O plano só pode ser alterado pelo suporte do
                                                sistema.
                                            </p>
                                        </div>
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
                                                disabled={!canEdit}
                                                {...form.register('zipCode')}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-foreground">
                                                Endereço
                                            </Label>
                                            <Input
                                                placeholder="Rua, avenida, etc."
                                                disabled={!canEdit}
                                                {...form.register('address')}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-foreground">
                                                Número
                                            </Label>
                                            <Input
                                                placeholder="Número"
                                                disabled={!canEdit}
                                                {...form.register('number')}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-foreground">
                                                Cidade
                                            </Label>
                                            <Input
                                                placeholder="Nome da cidade"
                                                disabled={!canEdit}
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
                                                disabled={!canEdit}
                                                {...form.register('state')}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {canEdit && (
                                    <div className="border-border flex justify-end gap-3 border-t pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCancel}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={
                                                !isFormReady || updateProfile.isPending
                                            }
                                        >
                                            {updateProfile.isPending
                                                ? 'Salvando...'
                                                : 'Salvar alterações'}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </form>
                </Form>
            </div>
        </div>
    );
}
