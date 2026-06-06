import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import {
    clinicUserEditFormSchema,
    type ClinicUserEditFormValues,
    normalizeClinicUserRole,
} from '@/application/clinic/clinic-user-form';
import type { ClinicUserUpdateDto } from '@/application/clinic/ports';
import { useClinicUser, useUpdateClinicUser } from '@/application/clinic/use-clinic-users';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { Req } from '@/components/clinic/patient/form/shared';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { CpfCnpjInput } from '@/components/ui/cpf-cnpj-input';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import {
    documentStoredValueForForm,
    inferClinicUserDocumentKind,
    serializeClinicUserDocument,
} from '@/lib/br-document-validation';
import { cn } from '@/lib/utils';

const labelClass = 'text-muted-foreground text-xs font-medium';

function EditFormSkeleton() {
    return (
        <div className="mx-auto max-w-3xl space-y-6 p-6" aria-hidden>
            <Skeleton className="h-9 w-64" />
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    );
}

function UserEditForm({
    user,
    role,
    roleChangeDisabled,
}: {
    user: ClinicUserSummary;
    role: ClinicUserEditFormValues['role'];
    roleChangeDisabled: boolean;
}) {
    const navigate = useNavigate();
    const updateUser = useUpdateClinicUser(user.id);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const defaultValues = useMemo(() => {
        const dk = inferClinicUserDocumentKind(user.document);

        return {
            name: user.name,
            email: user.email,
            password: '',
            confirmPassword: '',
            role,
            documentKind: dk,
            document: documentStoredValueForForm(dk, user.document),
        };
    }, [user.name, user.email, user.document, role]);

    const form = useForm<ClinicUserEditFormValues>({
        resolver: zodResolver(clinicUserEditFormSchema),
        defaultValues,
    });

    const documentKind = form.watch('documentKind');

    function onSubmit(values: ClinicUserEditFormValues) {
        const payload: ClinicUserUpdateDto = {
            name: values.name,
            email: values.email,
            role: values.role,
            document: serializeClinicUserDocument(values.documentKind, values.document),
        };
        if (values.password.trim()) payload.password = values.password;
        updateUser.mutate(payload, {
            onSuccess: () => navigate('/clinica/usuarios'),
        });
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-6">
            <h1 className="text-2xl font-bold">Editar usuário</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className={cn(labelClass)}>
                                    Nome
                                    <Req />
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        autoComplete="name"
                                        placeholder="Nome completo"
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
                            <FormItem className="space-y-1.5">
                                <FormLabel className={cn(labelClass)}>
                                    E-mail
                                    <Req />
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        {...field}
                                        autoComplete="email"
                                        placeholder="E-mail"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className={cn(labelClass)}>Nova senha</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            {...field}
                                            autoComplete="new-password"
                                            className="pr-10"
                                            placeholder="Nova senha"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Opcional. Deixe em branco para não alterar a senha atual.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className={cn(labelClass)}>Confirmar nova senha</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showConfirm ? 'text' : 'password'}
                                            {...field}
                                            autoComplete="new-password"
                                            className="pr-10"
                                            placeholder="Confirmar nova senha"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                                            aria-label={
                                                showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'
                                            }
                                        >
                                            {showConfirm ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Preencha apenas se alterar a senha.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className={cn(labelClass)}>
                                    Função
                                    <Req />
                                </FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={roleChangeDisabled}
                                >
                                    <FormControl>
                                        <SelectTrigger aria-disabled={roleChangeDisabled}>
                                            <SelectValue placeholder="Selecione uma opção" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="secretary">Secretário(a)</SelectItem>
                                        <SelectItem value="physiotherapist">Fisioterapeuta</SelectItem>
                                    </SelectContent>
                                </Select>
                                {roleChangeDisabled && (
                                    <FormDescription className="text-xs">
                                        Este é o usuário mestre da clínica; a função permanece
                                        administrador.
                                    </FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="documentKind"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className={cn(labelClass)}>
                                    Tipo de documento
                                    <Req />
                                </FormLabel>
                                <Select
                                    onValueChange={(v) => {
                                        form.setValue('document', '');
                                        field.onChange(v);
                                    }}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma opção" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="cpf">CPF</SelectItem>
                                        <SelectItem value="cnpj">CNPJ</SelectItem>
                                        <SelectItem value="crefito">
                                            CREFITO (registro profissional)
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
                            <FormItem className="space-y-1.5">
                                <FormLabel className={cn(labelClass)}>
                                    Número do documento
                                    <Req />
                                </FormLabel>
                                {documentKind === 'crefito' ? (
                                    <FormControl>
                                        <Input
                                            {...field}
                                            autoComplete="off"
                                            placeholder="Ex.: MG-123456 ou SP 123456-G"
                                        />
                                    </FormControl>
                                ) : (
                                    <FormControl>
                                        <CpfCnpjInput
                                            type={documentKind}
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                )}
                                <FormDescription className="text-xs">
                                    {documentKind === 'cpf' && 'Informe um CPF válido (11 dígitos).'}
                                    {documentKind === 'cnpj' &&
                                        'Informe um CNPJ válido (14 dígitos).'}
                                    {documentKind === 'crefito' &&
                                        'Informe o registro no conselho (UF em letras + número).'}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => navigate('/clinica/usuarios')}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={updateUser.isPending}>
                            {updateUser.isPending ? 'Salvando...' : 'Salvar alterações'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

export function UserEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: clinicUser, isLoading, isError } = useClinicUser(id!);

    const masterRoleLocked = clinicUser?.mestre === 1;

    if (isLoading) {
        return (
            <ClinicLayout>
                <div role="status" aria-live="polite" className="p-6">
                    <span className="sr-only">Carregando dados do usuário</span>
                    <EditFormSkeleton />
                </div>
            </ClinicLayout>
        );
    }

    if (isError || !clinicUser) {
        return (
            <ClinicLayout>
                <div className="mx-auto max-w-3xl space-y-4 p-6">
                    <p className="text-destructive text-sm">Não foi possível carregar o usuário.</p>
                    <Button type="button" variant="outline" onClick={() => navigate('/clinica/usuarios')}>
                        Voltar para lista
                    </Button>
                </div>
            </ClinicLayout>
        );
    }

    const resolvedRole = normalizeClinicUserRole(clinicUser.role);
    if (!resolvedRole) {
        return (
            <ClinicLayout>
                <div className="mx-auto max-w-3xl space-y-4 p-6">
                    <p className="text-destructive text-sm">Função do usuário inválida neste formulário.</p>
                    <Button type="button" variant="outline" onClick={() => navigate('/clinica/usuarios')}>
                        Voltar para lista
                    </Button>
                </div>
            </ClinicLayout>
        );
    }

    return (
        <ClinicLayout>
            <UserEditForm
                key={clinicUser.id}
                user={clinicUser}
                role={resolvedRole}
                roleChangeDisabled={masterRoleLocked}
            />
        </ClinicLayout>
    );
}
