import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
    clinicUserNewFormSchema,
    type ClinicUserNewFormValues,
    toClinicUserWriteDto,
} from '@/application/clinic/clinic-user-form';
import {
    useCreateClinicUser,
    useUploadClinicUserPhoto,
} from '@/application/clinic/use-clinic-users';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { PatientPhotoSection } from '@/components/clinic/patient/form/PatientPhotoSection';
import { Req } from '@/components/clinic/patient/form/shared';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CpfCnpjInput } from '@/components/ui/cpf-cnpj-input';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
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

function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <h2 className="border-b border-border pb-2 text-base font-semibold text-foreground">
            {children}
        </h2>
    );
}

export function UserNewPage() {
    const navigate = useNavigate();
    const createUser = useCreateClinicUser();
    const { mutateAsync: uploadPhoto, isPending: isUploading } =
        useUploadClinicUserPhoto();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

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

    async function onSubmit(values: ClinicUserNewFormValues) {
        try {
            const user = await createUser.mutateAsync(
                toClinicUserWriteDto(values),
            );

            if (photoFile) {
                try {
                    await uploadPhoto({ id: user.id, file: photoFile });
                } catch {
                    toast.warning(
                        'Usuário criado, mas falha ao enviar a foto. Você pode tentar novamente na edição.',
                    );
                }
            }

            navigate('/clinica/usuarios');
        } catch {
            // erro de criação já tratado pelo hook (toast)
        }
    }

    return (
        <ClinicLayout>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="flex items-start justify-between gap-4 px-6 py-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">
                                Novo usuário
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Preencha os dados para criar um novo usuário da
                                clínica.
                            </p>
                        </div>
                        <BackButton
                            to="/clinica/usuarios"
                            className="shrink-0"
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-3xl space-y-6">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
                            >
                                <Card>
                                    <CardContent className="space-y-8 p-6">
                                        <section className="space-y-4">
                                            <SectionTitle>Foto</SectionTitle>
                                            <PatientPhotoSection
                                                value={photoFile}
                                                onChange={setPhotoFile}
                                                cropTitle="Recortar foto do usuário"
                                                cropAspect={1}
                                            />
                                        </section>

                                        <section className="space-y-4">
                                            <SectionTitle>
                                                Dados da conta
                                            </SectionTitle>

                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1.5">
                                                        <FormLabel
                                                            className={cn(
                                                                labelClass,
                                                            )}
                                                        >
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
                                                        <FormLabel
                                                            className={cn(
                                                                labelClass,
                                                            )}
                                                        >
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
                                                        <FormLabel
                                                            className={cn(
                                                                labelClass,
                                                            )}
                                                        >
                                                            Senha
                                                            <Req />
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={
                                                                        showPassword
                                                                            ? 'text'
                                                                            : 'password'
                                                                    }
                                                                    {...field}
                                                                    autoComplete="new-password"
                                                                    className="pr-10"
                                                                    placeholder="Senha"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setShowPassword(
                                                                            !showPassword,
                                                                        )
                                                                    }
                                                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                                    aria-label={
                                                                        showPassword
                                                                            ? 'Ocultar senha'
                                                                            : 'Mostrar senha'
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
                                                        <FormLabel
                                                            className={cn(
                                                                labelClass,
                                                            )}
                                                        >
                                                            Confirmar senha
                                                            <Req />
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={
                                                                        showConfirm
                                                                            ? 'text'
                                                                            : 'password'
                                                                    }
                                                                    {...field}
                                                                    autoComplete="new-password"
                                                                    className="pr-10"
                                                                    placeholder="Confirmar senha"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setShowConfirm(
                                                                            !showConfirm,
                                                                        )
                                                                    }
                                                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                                                        <FormLabel
                                                            className={cn(
                                                                labelClass,
                                                            )}
                                                        >
                                                            Função
                                                            <Req />
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione uma opção" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="admin">
                                                                    Administrador
                                                                </SelectItem>
                                                                <SelectItem value="secretary">
                                                                    Secretário(a)
                                                                </SelectItem>
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
                                                        <FormLabel
                                                            className={cn(
                                                                labelClass,
                                                            )}
                                                        >
                                                            Status
                                                            <Req />
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            value={
                                                                field.value ??
                                                                '1'
                                                            }
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione uma opção" />
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
                                        </section>

                                        <section className="space-y-4">
                                            <SectionTitle>
                                                Documento
                                            </SectionTitle>

                                            <FormField
                                                control={form.control}
                                                name="documentKind"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1.5">
                                                        <FormLabel
                                                            className={cn(
                                                                labelClass,
                                                            )}
                                                        >
                                                            Tipo de documento
                                                            <Req />
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={(
                                                                v,
                                                            ) => {
                                                                form.setValue(
                                                                    'document',
                                                                    '',
                                                                );
                                                                field.onChange(
                                                                    v,
                                                                );
                                                            }}
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione uma opção" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="cpf">
                                                                    CPF
                                                                </SelectItem>
                                                                <SelectItem value="cnpj">
                                                                    CNPJ
                                                                </SelectItem>
                                                                <SelectItem value="crefito">
                                                                    CREFITO
                                                                    (registro
                                                                    profissional)
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
                                                        <FormLabel
                                                            className={cn(
                                                                labelClass,
                                                            )}
                                                        >
                                                            Número do documento
                                                            <Req />
                                                        </FormLabel>
                                                        {documentKind ===
                                                        'crefito' ? (
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
                                                                    type={
                                                                        documentKind
                                                                    }
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={
                                                                        field.onChange
                                                                    }
                                                                />
                                                            </FormControl>
                                                        )}
                                                        <FormDescription className="text-xs">
                                                            {documentKind ===
                                                                'cpf' &&
                                                                'Informe um CPF válido (11 dígitos).'}
                                                            {documentKind ===
                                                                'cnpj' &&
                                                                'Informe um CNPJ válido (14 dígitos).'}
                                                            {documentKind ===
                                                                'crefito' &&
                                                                'Informe o registro no conselho (UF em letras + número).'}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </section>

                                        <div className="flex gap-3 border-t border-border pt-6">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    navigate(
                                                        '/clinica/usuarios',
                                                    )
                                                }
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    createUser.isPending ||
                                                    isUploading
                                                }
                                            >
                                                {createUser.isPending ||
                                                isUploading
                                                    ? 'Salvando...'
                                                    : 'Criar usuário'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </ClinicLayout>
    );
}
