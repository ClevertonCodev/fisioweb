/**
 * PROTÓTIPO A, "Três passos": o mesmo cartão do login, em três passos
 * curtos (clínica, acesso, endereço dos links). Cada passo só avança com
 * os campos dele certos; o último mostra o resumo antes de criar.
 */
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthLayout, TextLink } from '@/components/clinic/auth/AuthLayout';
import { DsButton, dsCn } from '@/components/ds';

import { AccessFields, ClinicFields, Done, SlugField } from './parts';
import { type RegisterField, useRegister } from './shared';

const STEPS: { title: string; subtitle: string; fields: RegisterField[] }[] = [
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
        fields: ['slug'],
    },
];

export function VariantA() {
    const navigate = useNavigate();
    const r = useRegister();
    const [step, setStep] = useState(0);
    const cur = STEPS[step] ?? STEPS[0]!;
    const last = step === STEPS.length - 1;

    const next = () => {
        r.touchAll(cur.fields);
        if (!r.okFields(cur.fields)) return;
        if (last) r.submit();
        else setStep(step + 1);
    };

    if (r.done) {
        return (
            <AuthLayout
                title="Tudo certo!"
                subtitle="Falta só confirmar o e-mail."
            >
                <Done r={r} />
            </AuthLayout>
        );
    }

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
                    next();
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

                {step === 0 && <ClinicFields r={r} />}
                {step === 1 && <AccessFields r={r} />}
                {step === 2 && (
                    <>
                        <SlugField r={r} />
                        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-ds-lg border border-ds-border-subtle p-3 text-ds-caption">
                            <dt className="text-ds-content-muted">Clínica</dt>
                            <dd className="truncate font-medium">{r.v.name}</dd>
                            <dt className="text-ds-content-muted">
                                {r.v.typePerson === 'PF' ? 'CPF' : 'CNPJ'}
                            </dt>
                            <dd className="font-ds-mono">{r.v.document}</dd>
                            <dt className="text-ds-content-muted">Acesso</dt>
                            <dd className="truncate">{r.v.email}</dd>
                        </dl>
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
                        />
                    </div>
                </div>
            </form>
        </AuthLayout>
    );
}
