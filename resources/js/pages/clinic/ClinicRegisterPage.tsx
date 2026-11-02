import { zodResolver } from '@hookform/resolvers/zod';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    Check,
    Link2,
    MailCheck,
    User,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
    authErrorMessage,
    clinicPasswordStrength,
    extractRegisterFieldErrors,
    formatSlugInput,
    registerClinic,
    resendClinicVerification,
    slugUnavailableMessage,
    toClinicSlug,
    useClinicSlugAvailability,
} from '@/application/clinic';
import {
    clinicRegisterSchema,
    type ClinicRegisterField,
    type ClinicRegisterValues,
} from '@/application/clinic/register-schema';
import {
    AuthLayout,
    PasswordInput,
    TextLink,
} from '@/components/clinic/auth/AuthLayout';
import {
    applyMask,
    DsAlert,
    DsButton,
    DsCheckbox,
    dsCn,
    DsInput,
    formatCnpj,
    formatCpf,
} from '@/components/ds';

const SLUG_DEBOUNCE_MS = 400;
const RESEND_COOLDOWN_SECONDS = 30;

const STEPS: {
    title: string;
    subtitle: string;
    fields: ClinicRegisterField[];
}[] = [
    {
        title: 'Sua clínica',
        subtitle: 'Como ela aparece para os pacientes.',
        fields: ['name', 'typePerson', 'document'],
    },
    {
        title: 'Seu acesso',
        subtitle: 'Você será o usuário mestre da clínica.',
        fields: ['email', 'phone', 'password', 'passwordConfirmation'],
    },
    {
        title: 'Endereço dos links',
        subtitle: 'Os pacientes abrem os programas por ele.',
        fields: ['slug', 'termsAccepted'],
    },
];

const inputState = (err?: string) => (err ? 'error' : 'default');

export default function ClinicRegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [slugEdited, setSlugEdited] = useState(false);
    const [doneEmail, setDoneEmail] = useState<string | null>(null);
    const [serverAlert, setServerAlert] = useState<string | null>(null);

    const form = useForm<ClinicRegisterValues>({
        resolver: zodResolver(clinicRegisterSchema),
        mode: 'onTouched',
        defaultValues: {
            name: '',
            typePerson: 'PJ',
            document: '',
            email: '',
            phone: '',
            slug: '',
            password: '',
            passwordConfirmation: '',
            termsAccepted: false,
        },
    });

    const values = useWatch({ control: form.control });
    const typePerson = values.typePerson ?? 'PJ';
    const currentSlug = values.slug ?? '';
    const currentPassword = values.password ?? '';

    const [debouncedSlug, setDebouncedSlug] = useState(currentSlug);

    useEffect(() => {
        const timer = setTimeout(
            () => setDebouncedSlug(currentSlug),
            SLUG_DEBOUNCE_MS,
        );
        return () => clearTimeout(timer);
    }, [currentSlug]);

    const slugQuery = useClinicSlugAvailability(debouncedSlug);
    const isSlugPendingCheck =
        Boolean(currentSlug) &&
        (debouncedSlug !== currentSlug || slugQuery.isFetching);
    const isSlugAvailable =
        Boolean(currentSlug) &&
        debouncedSlug === currentSlug &&
        !slugQuery.isFetching &&
        slugQuery.data?.available === true;
    const slugAvailabilityError =
        debouncedSlug === currentSlug &&
        slugQuery.data &&
        !slugQuery.data.available
            ? slugUnavailableMessage(slugQuery.data.reason)
            : undefined;

    const cur = STEPS[step] ?? STEPS[0]!;
    const last = step === STEPS.length - 1;

    const handleNameChange = (raw: string) => {
        form.setValue('name', raw, {
            shouldDirty: true,
            shouldValidate: Boolean(form.formState.touchedFields.name),
        });
        if (!slugEdited) {
            const generated = toClinicSlug(raw);
            form.setValue('slug', generated, { shouldDirty: true });
            setDebouncedSlug(generated);
        }
    };

    const handleTypeChange = (nextType: 'PF' | 'PJ') => {
        const currentDoc = form.getValues('document') ?? '';
        form.setValue('typePerson', nextType, { shouldDirty: true });
        form.setValue(
            'document',
            nextType === 'PF' ? formatCpf(currentDoc) : formatCnpj(currentDoc),
            {
                shouldDirty: true,
                shouldValidate: Boolean(form.formState.touchedFields.document),
            },
        );
    };

    const handleDocumentChange = (raw: string) => {
        const formatted =
            typePerson === 'PF' ? formatCpf(raw) : formatCnpj(raw);
        form.setValue('document', formatted, {
            shouldDirty: true,
            shouldValidate: Boolean(form.formState.touchedFields.document),
        });
    };

    const handlePhoneChange = (raw: string) => {
        const digits = raw.replace(/\D/g, '');
        const masked = applyMask(
            digits,
            digits.length > 10 ? '(##) #####-####' : '(##) ####-####',
        );
        form.setValue('phone', masked, {
            shouldDirty: true,
            shouldValidate: Boolean(form.formState.touchedFields.phone),
        });
    };

    const handleSlugChange = (raw: string) => {
        setSlugEdited(true);
        form.setValue('slug', formatSlugInput(raw), {
            shouldDirty: true,
            shouldValidate: Boolean(form.formState.touchedFields.slug),
        });
    };

    const submitRegistration = async (data: ClinicRegisterValues) => {
        if (slugAvailabilityError || isSlugPendingCheck) {
            return;
        }

        setServerAlert(null);

        try {
            const created = await registerClinic({
                name: data.name,
                typePerson: data.typePerson,
                document: data.document,
                email: data.email,
                phone: data.phone,
                slug: data.slug,
                password: data.password,
                passwordConfirmation: data.passwordConfirmation,
                termsAccepted: data.termsAccepted,
            });
            setDoneEmail(created.email);
        } catch (err) {
            const fieldErrors = extractRegisterFieldErrors(err);
            if (fieldErrors) {
                let earliestStep = step;
                for (const [field, message] of Object.entries(fieldErrors) as [
                    ClinicRegisterField,
                    string,
                ][]) {
                    form.setError(field, { type: 'server', message });
                    const idx = STEPS.findIndex((s) =>
                        s.fields.includes(field),
                    );
                    if (idx !== -1 && idx < earliestStep) {
                        earliestStep = idx;
                    }
                }
                setStep(earliestStep);
                return;
            }

            const status =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { status?: number } }).response
                          ?.status
                    : undefined;

            if (status && status >= 400 && status < 500) {
                setServerAlert(
                    authErrorMessage(
                        err,
                        'Não foi possível concluir o cadastro. Confira os dados e tente novamente.',
                    ),
                );
                return;
            }

            toast.error(
                'Não foi possível criar sua conta agora. Tente novamente.',
            );
        }
    };

    const handleNext = async () => {
        setServerAlert(null);
        const valid = await form.trigger(cur.fields);
        if (!valid) return;

        if (!last) {
            setStep(step + 1);
            return;
        }

        if (slugAvailabilityError || isSlugPendingCheck) {
            return;
        }

        await form.handleSubmit(submitRegistration, (invalidErrors) => {
            const firstField = Object.keys(invalidErrors)[0] as
                | ClinicRegisterField
                | undefined;
            if (!firstField) return;
            const idx = STEPS.findIndex((s) => s.fields.includes(firstField));
            if (idx !== -1 && idx !== step) {
                setStep(idx);
            }
        })();
    };

    if (doneEmail) {
        return (
            <AuthLayout
                title="Tudo certo!"
                subtitle="Falta só confirmar o e-mail."
            >
                <RegistrationDone email={doneEmail} />
            </AuthLayout>
        );
    }

    const errors = form.formState.errors;
    const slugFieldError = errors.slug?.message ?? slugAvailabilityError;
    const linkPreview = `${window.location.host}/${currentSlug || 'sua-clinica'}/paciente/programas/…`;

    return (
        <AuthLayout
            title={cur.title}
            subtitle={cur.subtitle}
            footer={
                <p className="text-center text-ds-body-xs text-ds-content-secondary">
                    Já tem conta?{' '}
                    <TextLink
                        onClick={() => navigate('/clinica/login')}
                        className="font-semibold"
                    >
                        Entrar
                    </TextLink>
                </p>
            }
        >
            <form
                className="flex flex-col gap-5"
                noValidate
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleNext();
                }}
            >
                <ol aria-label="Passos" className="flex gap-1.5">
                    {STEPS.map((s, i) => (
                        <li
                            key={s.title}
                            className="flex flex-1 flex-col gap-1"
                        >
                            <span
                                className={dsCn(
                                    'h-1 rounded-ds-pill',
                                    i <= step
                                        ? 'bg-ds-primary-80'
                                        : 'bg-ds-surface-subtle',
                                )}
                            />
                            <span
                                className={dsCn(
                                    'text-ds-micro',
                                    i === step
                                        ? 'font-semibold text-ds-content-primary'
                                        : 'text-ds-content-muted',
                                )}
                            >
                                {i + 1}. {s.title}
                            </span>
                        </li>
                    ))}
                </ol>

                {serverAlert && (
                    <DsAlert variant="danger" mode="compact">
                        {serverAlert}
                    </DsAlert>
                )}

                {step === 0 && (
                    <>
                        <Controller
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <DsInput
                                    label="Nome da clínica"
                                    placeholder="Ex.: Clínica Movimento"
                                    value={field.value}
                                    onValueChange={handleNameChange}
                                    onBlur={field.onBlur}
                                    state={inputState(errors.name?.message)}
                                    helper={errors.name?.message}
                                    autocomplete="organization"
                                />
                            )}
                        />
                        <div
                            role="radiogroup"
                            aria-label="Tipo"
                            className="grid grid-cols-2 gap-2"
                        >
                            {(
                                [
                                    {
                                        key: 'PJ',
                                        label: 'Clínica (CNPJ)',
                                        icon: <Building2 className="size-4" />,
                                    },
                                    {
                                        key: 'PF',
                                        label: 'Autônomo (CPF)',
                                        icon: <User className="size-4" />,
                                    },
                                ] as const
                            ).map((o) => (
                                <button
                                    key={o.key}
                                    type="button"
                                    role="radio"
                                    aria-checked={typePerson === o.key}
                                    onClick={() => handleTypeChange(o.key)}
                                    className={dsCn(
                                        'flex cursor-pointer items-center justify-center gap-2 rounded-ds-md border px-3 py-2.5 text-ds-body-xs transition-colors',
                                        typePerson === o.key
                                            ? 'border-ds-primary-80 bg-ds-surface-brand-subtle font-medium text-ds-content-brand'
                                            : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-strong',
                                    )}
                                >
                                    {o.icon}
                                    {o.label}
                                </button>
                            ))}
                        </div>
                        <Controller
                            control={form.control}
                            name="document"
                            render={({ field }) => (
                                <DsInput
                                    label={typePerson === 'PF' ? 'CPF' : 'CNPJ'}
                                    inputMode="numeric"
                                    value={field.value}
                                    onValueChange={handleDocumentChange}
                                    onBlur={field.onBlur}
                                    state={inputState(errors.document?.message)}
                                    helper={errors.document?.message}
                                />
                            )}
                        />
                    </>
                )}

                {step === 1 && (
                    <>
                        <Controller
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <DsInput
                                    label="E-mail"
                                    type="email"
                                    autocomplete="email"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    onBlur={field.onBlur}
                                    state={inputState(errors.email?.message)}
                                    helper={
                                        errors.email?.message ??
                                        'Você entra com ele.'
                                    }
                                />
                            )}
                        />
                        <Controller
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <DsInput
                                    label="Telefone (opcional)"
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    value={field.value ?? ''}
                                    onValueChange={handlePhoneChange}
                                    onBlur={field.onBlur}
                                    state={inputState(errors.phone?.message)}
                                    helper={errors.phone?.message}
                                />
                            )}
                        />
                        <div className="flex flex-col gap-2">
                            <Controller
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <PasswordInput
                                        label="Senha"
                                        autocomplete="new-password"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        onBlur={field.onBlur}
                                        state={inputState(
                                            errors.password?.message,
                                        )}
                                        helper={errors.password?.message}
                                    />
                                )}
                            />
                            {currentPassword && (
                                <PasswordStrengthMeter
                                    password={currentPassword}
                                />
                            )}
                        </div>
                        <Controller
                            control={form.control}
                            name="passwordConfirmation"
                            render={({ field }) => (
                                <PasswordInput
                                    label="Confirmar senha"
                                    autocomplete="new-password"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    onBlur={field.onBlur}
                                    state={inputState(
                                        errors.passwordConfirmation?.message,
                                    )}
                                    helper={
                                        errors.passwordConfirmation?.message
                                    }
                                />
                            )}
                        />
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="flex flex-col gap-1.5">
                            <Controller
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <DsInput
                                        label="Endereço dos links dos pacientes"
                                        value={field.value}
                                        onValueChange={handleSlugChange}
                                        onBlur={() => {
                                            form.setValue(
                                                'slug',
                                                toClinicSlug(field.value ?? ''),
                                                { shouldValidate: true },
                                            );
                                            field.onBlur();
                                        }}
                                        iconLeft={<Link2 />}
                                        state={
                                            slugFieldError
                                                ? 'error'
                                                : isSlugAvailable
                                                  ? 'success'
                                                  : 'default'
                                        }
                                        helper={
                                            slugFieldError ??
                                            (currentSlug
                                                ? isSlugPendingCheck
                                                    ? 'Conferindo disponibilidade...'
                                                    : 'Disponível. Depois de criado, não muda.'
                                                : 'Sai do nome da clínica.')
                                        }
                                    />
                                )}
                            />
                            <p className="truncate rounded-ds-md bg-ds-surface-subtle px-3 py-2 font-ds-mono text-ds-caption text-ds-content-secondary">
                                {linkPreview}
                            </p>
                        </div>

                        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-ds-lg border border-ds-border-subtle p-3 text-ds-caption">
                            <dt className="text-ds-content-muted">Clínica</dt>
                            <dd className="truncate font-medium">
                                {values.name}
                            </dd>
                            <dt className="text-ds-content-muted">
                                {typePerson === 'PF' ? 'CPF' : 'CNPJ'}
                            </dt>
                            <dd className="font-ds-mono">{values.document}</dd>
                            <dt className="text-ds-content-muted">Acesso</dt>
                            <dd className="truncate">{values.email}</dd>
                        </dl>

                        <div className="flex flex-col gap-1">
                            <Controller
                                control={form.control}
                                name="termsAccepted"
                                render={({ field }) => (
                                    <DsCheckbox
                                        checked={Boolean(field.value)}
                                        onCheckedChange={(checked) =>
                                            form.setValue(
                                                'termsAccepted',
                                                checked === true,
                                                {
                                                    shouldDirty: true,
                                                    shouldTouch: true,
                                                    shouldValidate: true,
                                                },
                                            )
                                        }
                                        onBlur={field.onBlur}
                                        label="Li e aceito os Termos de Uso e a Política de Privacidade (LGPD)"
                                    />
                                )}
                            />
                            {errors.termsAccepted?.message && (
                                <p
                                    role="alert"
                                    className="text-ds-caption text-ds-status-danger-content"
                                >
                                    {errors.termsAccepted.message}
                                </p>
                            )}
                        </div>
                    </>
                )}

                <div className="flex gap-2">
                    {step > 0 && (
                        <DsButton
                            type="button"
                            variant="secondary"
                            iconPosition="left"
                            icon={<ArrowLeft />}
                            label="Voltar"
                            onClick={() => setStep(step - 1)}
                        />
                    )}
                    <div className="flex-1 [&>button]:w-full">
                        <DsButton
                            type="submit"
                            iconPosition="right"
                            icon={last ? undefined : <ArrowRight />}
                            label={last ? 'Criar conta' : 'Continuar'}
                            loading={form.formState.isSubmitting}
                        />
                    </div>
                </div>
            </form>
        </AuthLayout>
    );
}

function PasswordStrengthMeter({ password }: { password: string }) {
    const { score, checks, label } = clinicPasswordStrength(password);
    const color = [
        'var(--ds-color-danger-100)',
        'var(--ds-color-danger-100)',
        'var(--ds-color-warning-100)',
        'var(--ds-color-success-80)',
        'var(--ds-color-success-100)',
    ][score];

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                        <span
                            key={i}
                            className="h-1 flex-1 rounded-ds-pill bg-ds-surface-subtle"
                            style={
                                i < score ? { background: color } : undefined
                            }
                        />
                    ))}
                </div>
                <span className="text-ds-caption text-ds-content-secondary">
                    {label}
                </span>
            </div>
            <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
                {checks.map((c) => (
                    <li
                        key={c.label}
                        className={dsCn(
                            'flex items-center gap-1 text-ds-caption',
                            c.ok
                                ? 'text-ds-status-success-content'
                                : 'text-ds-content-muted',
                        )}
                    >
                        {c.ok ? (
                            <Check className="size-3" />
                        ) : (
                            <X className="size-3" />
                        )}
                        {c.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function RegistrationDone({ email }: { email: string }) {
    const navigate = useNavigate();
    const [wait, setWait] = useState(0);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (wait <= 0) return;
        const timer = setTimeout(() => setWait((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [wait]);

    const handleResend = async () => {
        setError(null);
        setSending(true);
        try {
            await resendClinicVerification(email);
            setWait(RESEND_COOLDOWN_SECONDS);
        } catch (err) {
            setError(
                authErrorMessage(
                    err,
                    'Não foi possível reenviar o e-mail agora. Tente novamente.',
                ),
            );
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-ds-full bg-ds-status-success-surface text-ds-status-success-content">
                <MailCheck className="size-7" />
            </span>
            <div>
                <p className="text-ds-body-lg font-semibold">
                    Confira sua caixa de entrada
                </p>
                <p className="mt-1 text-ds-body-xs text-ds-content-secondary">
                    Enviamos um link de confirmação para <b>{email}</b>. Abra o
                    link do e-mail para liberar o acesso ao painel da clínica.
                </p>
            </div>
            {error && (
                <DsAlert variant="danger" mode="compact" className="w-full">
                    {error}
                </DsAlert>
            )}
            <DsButton
                variant="secondary"
                size="full"
                label={wait > 0 ? `Reenviar em ${wait} s` : 'Reenviar e-mail'}
                disabled={wait > 0}
                loading={sending}
                onClick={() => void handleResend()}
            />
            <DsButton
                size="full"
                label="Ir para o login"
                onClick={() => navigate('/clinica/login')}
            />
        </div>
    );
}
