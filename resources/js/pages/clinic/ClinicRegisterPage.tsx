import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
    clinicRegisterSchema,
    type ClinicRegisterValues,
} from '@/application/clinic/register-schema';
import { Button } from '@/components/ui/button';
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

export default function ClinicRegisterPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<ClinicRegisterValues>({
        resolver: zodResolver(clinicRegisterSchema),
        mode: 'onTouched',
        defaultValues: {
            name: '',
            typePerson: undefined,
            document: '',
            email: '',
            phone: '',
            slug: '',
            password: '',
            passwordConfirmation: '',
        },
    });

    const watchedType = form.watch('typePerson');
    const watchedName = form.watch('name');
    const watchedSlug = form.watch('slug');

    const handleSubmit = form.handleSubmit(() => {
        // Visual-only por enquanto: ainda não há endpoint de auto-cadastro.
        toast.info(
            'Cadastro online em breve. Fale com o suporte para criar sua conta.',
        );
    });

    return (
        <div className="relative h-screen overflow-y-auto bg-background">
            {/* Decorative background (fixed layer, não interfere no scroll) */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -right-40 -bottom-40 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
            </div>

            {/* Card */}
            <div className="relative z-10 mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-4 py-12">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-sm shadow-primary/10">
                        <Activity className="h-7 w-7 text-primary" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                        FisioClinic
                    </span>
                </div>

                <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl shadow-primary/5 backdrop-blur-sm sm:p-10">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold text-foreground">
                            Criar conta
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Cadastre sua clínica para começar
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nome da clínica */}
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
                                                className="h-12 rounded-xl border-border bg-background text-base"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Tipo de pessoa */}
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
                                                    <SelectTrigger className="h-12 rounded-xl">
                                                        <SelectValue placeholder="Selecione" />
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
                                                    disabled={!watchedType}
                                                    className="h-12 rounded-xl"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

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
                                            <div className="relative">
                                                <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    type="email"
                                                    placeholder="email@exemplo.com"
                                                    className="h-12 rounded-xl border-border bg-background pl-11 text-base"
                                                    {...field}
                                                />
                                            </div>
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
                                                className="h-12 rounded-xl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Slug */}
                            <div>
                                <SlugInput
                                    value={watchedSlug}
                                    onChange={(s) =>
                                        form.setValue('slug', s, {
                                            shouldValidate:
                                                form.formState.touchedFields
                                                    .slug,
                                        })
                                    }
                                    baseName={watchedName}
                                    required
                                />
                                {form.formState.errors.slug && (
                                    <p className="mt-1 text-[11px] font-medium text-destructive">
                                        {form.formState.errors.slug.message}
                                    </p>
                                )}
                            </div>

                            {/* Senha */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label className="text-foreground">
                                            Senha{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    type={
                                                        showPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    placeholder="Crie uma senha"
                                                    className="h-12 rounded-xl border-border bg-background px-11 text-base"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            !showPassword,
                                                        )
                                                    }
                                                    className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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

                            {/* Confirmação de senha */}
                            <FormField
                                control={form.control}
                                name="passwordConfirmation"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label className="text-foreground">
                                            Confirmar senha{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    type={
                                                        showPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    placeholder="Repita a senha"
                                                    className="h-12 rounded-xl border-border bg-background pl-11 text-base"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="h-12 w-full rounded-xl text-base font-semibold"
                                disabled={form.formState.isSubmitting}
                            >
                                Criar conta
                            </Button>
                        </form>
                    </Form>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Já possui uma conta?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/clinica/login')}
                            className="font-semibold text-primary transition-colors hover:text-primary/80"
                        >
                            Entrar
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
