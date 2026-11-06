import { zodResolver } from '@hookform/resolvers/zod';
import {
    ArrowLeft,
    Building2,
    ChevronRight,
    Lock,
    UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { AppLogo } from '@/components/AppLogo';
import { DsAlert } from '@/components/ds/alert/DsAlert';
import { DsButton } from '@/components/ds/button/DsButton';
import { DsInput } from '@/components/ds/input/DsInput';
import { DsPatientNavbar } from '@/components/ds/navbar/DsPatientNavbar';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicOption } from '@/domain/patient/auth';
import {
    getPatientClinicSlug,
    setPatientClinicSlug,
} from '@/infrastructure/api/client';

type Step = 'identifier' | 'clinic' | 'credentials';

export default function PatientLoginPage() {
    const { clinicSlug } = useParams<{ clinicSlug?: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, guard, user } = useAuth();

    const next = searchParams.get('next');

    const [step, setStep] = useState<Step>(
        clinicSlug ? 'credentials' : 'identifier',
    );
    const [clinics, setClinics] = useState<ClinicOption[]>([]);
    const [selectedClinic, setSelectedClinic] = useState<ClinicOption | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);

    const findClinics = useFindPatientClinics();
    const login = usePatientLogin();

    const form = useForm<PatientLoginFormValues>({
        resolver: zodResolver(patientLoginFormSchema),
        defaultValues: { identifier: '', password: '' },
        mode: 'onSubmit',
    });

    const resolveClinicSlug = useCallback(
        (): string =>
            clinicSlug ?? user?.clinicSlug ?? getPatientClinicSlug() ?? '',
        [clinicSlug, user?.clinicSlug],
    );

    useEffect(() => {
        if (!isAuthenticated || guard !== 'patient') return;

        const slug = resolveClinicSlug();
        const dest = patientPostLoginPath(next, slug);

        if (dest !== '/paciente/login') {
            navigate(dest, { replace: true });
        }
    }, [isAuthenticated, guard, navigate, next, resolveClinicSlug]);

    const clinicLabel = useMemo(() => {
        if (selectedClinic) return selectedClinic.name;
        if (clinicSlug) return clinicSlug.replace(/-/g, ' ');
        return null;
    }, [selectedClinic, clinicSlug]);

    const genericFailure =
        'Não encontramos essa combinação. Confira seus dados e tente de novo.';

    const handleIdentifierSubmit = async () => {
        const valid = await form.trigger('identifier');
        if (!valid) return;

        setError(null);

        try {
            const found = await findClinics.mutateAsync(
                form.getValues('identifier'),
            );

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

    const handleLogin = form.handleSubmit(async (values) => {
        setError(null);

        const clinicId = selectedClinic?.id;

        if (!clinicId && !clinicSlug) {
            setStep('identifier');
            return;
        }

        try {
            const result = await login.mutateAsync({
                identifier: values.identifier,
                password: values.password,
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
        <div className="flex h-full w-full flex-col overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <DsPatientNavbar hideAuthAction showPrototypeBadge />

            <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 pb-24 sm:py-12 sm:pb-32">
                {/* Efeito de luz ambiente de marca contido */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-ds-primary-30/20 blur-3xl ds-dark:bg-ds-primary-80/10" />
                </div>

                <div className="relative z-10 w-full max-w-md">
                    {/* Header do Card */}
                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs">
                            <AppLogo className="size-7 ds-dark:text-ds-white" />
                        </div>
                        <h1 className="font-ds text-ds-h4 font-semibold tracking-tight text-ds-content-primary">
                            Área do paciente
                        </h1>
                        <p className="mt-1 text-ds-body-xs text-ds-content-muted">
                            {step === 'clinic'
                                ? 'Em qual clínica você quer entrar?'
                                : 'Acesse seus programas de exercícios'}
                        </p>
                    </div>

                    {/* Container Principal */}
                    <div className="rounded-ds-2xl border border-ds-border-subtle bg-ds-surface-default p-6 shadow-ds-sm sm:p-8">
                        {step === 'credentials' && clinicLabel && (
                            <div className="mb-5 flex items-center gap-3 rounded-ds-lg border border-ds-border-brand-subtle bg-ds-surface-brand-subtle p-3.5">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-ds-md bg-ds-primary-80 text-white">
                                    <Building2 className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="block text-[11px] font-semibold tracking-wider text-ds-primary-80 uppercase ds-dark:text-ds-primary-60">
                                        Entrando em
                                    </span>
                                    <p className="truncate text-ds-body-xs font-semibold text-ds-content-primary capitalize">
                                        {clinicLabel}
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="mb-5">
                                <DsAlert variant="danger">{error}</DsAlert>
                            </div>
                        )}

                        {step === 'clinic' ? (
                            <div className="space-y-2.5">
                                {clinics.map((clinic) => (
                                    <button
                                        key={clinic.id}
                                        type="button"
                                        onClick={() =>
                                            handleClinicChoice(clinic)
                                        }
                                        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-3.5 text-left transition-all hover:border-ds-primary-80 hover:bg-ds-surface-subtle hover:shadow-ds-xs"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-ds-md bg-ds-primary-20 text-ds-primary-80 ds-dark:bg-ds-primary-80/20 ds-dark:text-ds-primary-60">
                                                <Building2 className="size-4.5" />
                                            </div>
                                            <span className="truncate text-ds-body-xs font-medium text-ds-content-primary">
                                                {clinic.name}
                                            </span>
                                        </div>
                                        <ChevronRight className="size-4 text-ds-content-subtle" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <form
                                noValidate
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    if (step === 'identifier') {
                                        void handleIdentifierSubmit();
                                    } else {
                                        void handleLogin(event);
                                    }
                                }}
                                className="space-y-4"
                            >
                                <DsInput
                                    label="CPF ou e-mail"
                                    placeholder="000.000.000-00 ou seu e-mail"
                                    autocomplete="username"
                                    iconLeft={
                                        <UserRound className="size-4 text-ds-content-muted" />
                                    }
                                    {...form.register('identifier')}
                                    state={
                                        form.formState.errors.identifier
                                            ? 'error'
                                            : 'default'
                                    }
                                    helper={
                                        form.formState.errors.identifier
                                            ?.message
                                    }
                                />

                                {step === 'credentials' && (
                                    <DsInput
                                        type="password"
                                        label="Senha"
                                        placeholder="Sua senha"
                                        autocomplete="current-password"
                                        iconLeft={
                                            <Lock className="size-4 text-ds-content-muted" />
                                        }
                                        {...form.register('password')}
                                        state={
                                            form.formState.errors.password
                                                ? 'error'
                                                : 'default'
                                        }
                                        helper={
                                            form.formState.errors.password
                                                ?.message ||
                                            'Senha inicial fornecida pela clínica — normalmente o seu CPF, só os números.'
                                        }
                                    />
                                )}

                                <div className="pt-2">
                                    <DsButton
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="w-full justify-center"
                                        label={
                                            isSubmitting
                                                ? 'Entrando…'
                                                : step === 'identifier'
                                                  ? 'Continuar'
                                                  : 'Entrar'
                                        }
                                        loading={isSubmitting}
                                    />
                                </div>
                            </form>
                        )}

                        {(step !== 'identifier' || !clinicSlug) && (
                            <div className="mt-4 border-t border-ds-border-subtle pt-3 text-center">
                                <DsButton
                                    type="button"
                                    variant="tertiary"
                                    size="sm"
                                    iconPosition="left"
                                    icon={<ArrowLeft className="size-3.5" />}
                                    label="Voltar"
                                    onClick={handleBack}
                                    className="mx-auto"
                                />
                            </div>
                        )}
                    </div>

                    <p className="mt-5 text-center text-ds-caption text-ds-content-muted">
                        Não consegue entrar? Fale com a sua clínica.
                    </p>

                    {clinicSlug && (
                        <p className="mt-2 text-center text-ds-body-xs">
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        patientProgramsListPath(clinicSlug),
                                    )
                                }
                                className="cursor-pointer font-medium text-ds-primary-80 transition-colors hover:text-ds-primary-100 hover:underline ds-dark:text-ds-primary-60"
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
