import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import {
    clinicUserNewFormSchema,
    type ClinicUserNewFormValues,
    toClinicUserWriteDto,
} from '@/application/clinic/clinic-user-form';
import { useCreateClinicUser } from '@/application/clinic/use-clinic-users';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const labelClass = 'text-muted-foreground text-xs font-medium';

export function UserNewPage() {
    const navigate = useNavigate();
    const createUser = useCreateClinicUser();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const form = useForm<ClinicUserNewFormValues>({
        resolver: zodResolver(clinicUserNewFormSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: undefined,
            status: '1',
            documentKind: 'cpf',
            document: '',
        },
    });

    const documentKind = form.watch('documentKind');

    function onSubmit(values: ClinicUserNewFormValues) {
        createUser.mutate(toClinicUserWriteDto(values), {
            onSuccess: () => navigate('/clinica/usuarios'),
        });
    }

    return (
        <ClinicLayout>
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <h1 className="text-2xl font-bold">Novo usuário</h1>

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
                                    <FormLabel className={cn(labelClass)}>
                                        Senha
                                        <Req />
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                {...field}
                                                autoComplete="new-password"
                                                className="pr-10"
                                                placeholder="Senha"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                                                aria-label={
                                                    showPassword ? 'Ocultar senha' : 'Mostrar senha'
                                                }
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className={cn(labelClass)}>
                                        Confirmar senha
                                        <Req />
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showConfirm ? 'text' : 'password'}
                                                {...field}
                                                autoComplete="new-password"
                                                className="pr-10"
                                                placeholder="Confirmar senha"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                                                aria-label={
                                                    showConfirm
                                                        ? 'Ocultar confirmação de senha'
                                                        : 'Mostrar confirmação de senha'
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
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma opção" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="secretary">Secretário(a)</SelectItem>
                                            <SelectItem value="physiotherapist">
                                                Fisioterapeuta
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className={cn(labelClass)}>
                                        Status
                                        <Req />
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value ?? '1'}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma opção" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="1">Ativo</SelectItem>
                                            <SelectItem value="0">Inativo</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/clinica/usuarios')}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createUser.isPending}>
                                {createUser.isPending ? 'Salvando...' : 'Criar usuário'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </ClinicLayout>
    );
}
