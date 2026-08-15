import { zodResolver } from '@hookform/resolvers/zod';
import {
    ArrowLeft,
    Building2,
    ChevronRight,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { patientPostLoginPath } from '@/application/patient/patient-auth-paths';
import {
    patientLoginFormSchema,
    type PatientLoginFormValues,
} from '@/application/patient/patient-login-form';
import { patientProgramsListPath } from '@/application/patient/patient-program-paths';
import {
    patientLoginErrorMessage,
    useFindPatientClinics,
    usePatientLogin,
} from '@/application/patient/use-patient-auth';
import { PatientNavbar } from '@/components/PatientNavbar';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicOption } from '@/domain/patient/auth';
import { getPatientClinicSlug, setPatientClinicSlug } from '@/infrastructure/api/client';
import { cn } from '@/lib/utils';

type Step = 'identifier' | 'clinic' | 'credentials';

export default function PatientLoginPage() {
    const { clinicSlug } = useParams<{ clinicSlug?: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, guard, user } = useAuth();

    const next = searchParams.get('next');

    // Com slug na URL a clínica já é conhecida: login em uma etapa só.
    const [step, setStep] = useState<Step>(
        clinicSlug ? 'credentials' : 'identifier',
    );
    const [clinics, setClinics] = useState<ClinicOption[]>([]);
    const [selectedClinic, setSelectedClinic] = useState<ClinicOption | null>(
        null,
    );
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const findClinics = useFindPatientClinics();
    const login = usePatientLogin();

    const form = useForm<PatientLoginFormValues>({
        resolver: zodResolver(patientLoginFormSchema),
        defaultValues: { identifier: '', password: '' },
        mode: 'onSubmit',
    });

    const resolveClinicSlug = (): string =>
        clinicSlug ?? user?.clinicSlug ?? getPatientClinicSlug() ?? '';

    // Paciente já autenticado não vê o formulário de novo.
    useEffect(() => {
        if (!isAuthenticated || guard !== 'patient') return;

        const slug = resolveClinicSlug();
        const dest = patientPostLoginPath(next, slug);

        // Sem slug não há lista de programas — evita `//paciente/programas`.
        if (dest !== '/paciente/login') {
            navigate(dest, { replace: true });
        }
    }, [isAuthenticated, guard, navigate, next, clinicSlug, user?.clinicSlug]);

    const clinicLabel = useMemo(() => {
        if (selectedClinic) return selectedClinic.name;
        if (clinicSlug) return clinicSlug.replace(/-/g, ' ');
        return null;
    }, [selectedClinic, clinicSlug]);

    const genericFailure =
        'Não encontramos essa combinação. Confira seus dados e tente de novo.';

    /** Passo 1 — descobre as clínicas do identificador. */
    const handleIdentifierSubmit = async () => {
        const valid = await form.trigger('identifier');
        if (!valid) return;

        setError(null);

        try {
            const found = await findClinics.mutateAsync(
                form.getValues('identifier'),
            );

            // Lista vazia recebe a MESMA mensagem do erro de credencial:
            // distinguir revelaria a existência do cadastro.
            if (found.length === 0) {
                setError(genericFailure);
                return;
            }

            setClinics(found);

            if (found.length === 1) {
                setSelectedClinic(found[0]);
                setStep('credentials');
                return;
            }

            setStep('clinic');
        } catch (err) {
            setError(patientLoginErrorMessage(err));
        }
    };

    const handleClinicChoice = (clinic: ClinicOption) => {
        setSelectedClinic(clinic);
        setError(null);
        setStep('credentials');
    };

    /** Volta preservando o que já foi digitado (estado do RHF, não remontagem). */
    const handleBack = () => {
        setError(null);
        if (step === 'credentials' && !clinicSlug) {
            setStep(clinics.length > 1 ? 'clinic' : 'identifier');
            return;
        }
        if (step === 'clinic') {
            setStep('identifier');
            return;
        }
        navigate(-1);
    };

    /** Passo final — autentica. */
    const handleLogin = form.handleSubmit(async (values) => {
        setError(null);

        const clinicId = selectedClinic?.id;

        // Sem clínica escolhida e sem slug não há como autenticar.
        if (!clinicId && !clinicSlug) {
            setStep('identifier');
            return;
        }

        try {
            const result = await login.mutateAsync({
                identifier: values.identifier,
                password: values.password,
                // No contexto de slug não há clínica escolhida: quem resolve
                // o id é o backend, a partir do slug.
                clinicId: clinicId ?? null,
                clinicSlug: clinicId ? null : (clinicSlug ?? null),
            });

            const slug = selectedClinic?.slug ?? clinicSlug ?? '';
            if (slug) {
                setPatientClinicSlug(slug);
            }

            navigate(patientPostLoginPath(next, slug), { replace: true });

            return result;
        } catch (err) {
            setError(patientLoginErrorMessage(err));
            form.setValue('password', '');
        }
    });

    const isSubmitting = login.isPending || findClinics.isPending;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <PatientNavbar hideAuthAction />

            <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
                {/* Acento decorativo — apenas tokens */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
                />

                <div className="relative z-10 w-full max-w-md">
                    <div className="mb-6 text-center">
                        <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                            Área do paciente
                        </h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            {step === 'clinic'
                                ? 'Em qual clínica você quer entrar?'
                                : 'Acesse seus programas de exercícios'}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                        {/* A clínica é informação de segurança: o paciente
                            precisa vê-la antes de digitar a senha. */}
                        {step === 'credentials' && clinicLabel && (
                            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3">
                                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                        Entrando em
                                    </p>
                                    <p className="truncate text-sm font-semibold text-foreground capitalize">
                                        {clinicLabel}
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div
                                role="alert"
                                aria-live="polite"
                                className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                            >
                                {error}
                            </div>
                        )}

                        {step === 'clinic' ? (
                            <div className="space-y-2">
                                {clinics.map((clinic) => (
                                    <button
                                        key={clinic.id}
                                        type="button"
                                        onClick={() =>
                                            handleClinicChoice(clinic)
                                        }
                                        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-accent"
                                    >
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Building2 className="h-4 w-4" />
                                            </span>
                                            <span className="truncate text-sm font-medium text-foreground">
                                                {clinic.name}
                                            </span>
                                        </span>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <Form {...form}>
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        if (step === 'identifier') {
                                            void handleIdentifierSubmit();
                                        } else {
                                            void handleLogin(event);
                                        }
                                    }}
                                    className="space-y-4"
                                    noValidate
                                >
                                    <FormField
                                        control={form.control}
                                        name="identifier"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-foreground">
                                                    CPF ou e-mail
                                                </FormLabel>
                                                {/* FormControl precisa envolver
                                                    o Input diretamente: é ele
                                                    que recebe o id do label. */}
                                                <div className="relative">
                                                    <UserRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            inputMode={
                                                                field.value.includes(
                                                                    '@',
                                                                )
                                                                    ? 'email'
                                                                    : 'numeric'
                                                            }
                                                            autoComplete="username"
                                                            placeholder="000.000.000-00 ou seu e-mail"
                                                            className="h-12 rounded-xl pl-10 text-base"
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {step === 'credentials' && (
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium text-foreground">
                                                        Senha
                                                    </FormLabel>
                                                    <div className="relative">
                                                        <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type={
                                                                    showPassword
                                                                        ? 'text'
                                                                        : 'password'
                                                                }
                                                                autoComplete="current-password"
                                                                placeholder="Sua senha"
                                                                className="h-12 rounded-xl px-10 text-base"
                                                            />
                                                        </FormControl>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShowPassword(
                                                                    !showPassword,
                                                                )
                                                            }
                                                            aria-label={
                                                                showPassword
                                                                    ? 'Ocultar senha'
                                                                    : 'Mostrar senha'
                                                            }
                                                            className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                                                        >
                                                            {showPassword ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <FormMessage />
                                                    {/* Neutro de propósito: quem não tem
                                                        CPF recebe o e-mail como senha padrão. */}
                                                    <p className="pt-0.5 text-xs text-muted-foreground">
                                                        Senha inicial fornecida
                                                        pela clínica —
                                                        normalmente o seu CPF,
                                                        só os números.
                                                    </p>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={cn(
                                            'h-12 w-full cursor-pointer rounded-xl text-base font-semibold',
                                        )}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Entrando…
                                            </>
                                        ) : step === 'identifier' ? (
                                            'Continuar'
                                        ) : (
                                            'Entrar'
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        )}

                        {(step !== 'identifier' || !clinicSlug) && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="mt-5 flex w-full cursor-pointer items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Voltar
                            </button>
                        )}
                    </div>

                    <p className="mt-5 text-center text-sm text-muted-foreground">
                        Não consegue entrar? Fale com a sua clínica.
                    </p>

                    {clinicSlug && (
                        <p className="mt-2 text-center text-sm">
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        patientProgramsListPath(clinicSlug),
                                    )
                                }
                                className="cursor-pointer font-medium text-primary transition-colors hover:text-primary/80"
                            >
                                Voltar aos programas
                            </button>
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}
