import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { SelectOption } from '@/components/ds';
import {
    DsButton,
    DsCheckbox,
    DsCpfField,
    DsInput,
    DsMoneyInput,
    DsPhoneField,
    DsSelect,
    getCpfValidationError,
    getPhoneValidationError,
} from '@/components/ds';

const CONVENIOS: SelectOption[] = [
    { value: 'particular', label: 'Particular' },
    { value: 'saude-exemplo', label: 'Saúde Exemplo' },
    { value: 'plano-teste', label: 'Plano Teste' },
];

const schema = z.object({
    nome: z.string().trim().min(1, 'Informe o nome'),
    cpf: z.string().superRefine((value, ctx) => {
        const error = getCpfValidationError(value, true);
        if (error)
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    }),
    telefone: z
        .string()
        .min(1, 'Informe o telefone')
        .refine((value) => !getPhoneValidationError(value), 'Número inválido'),
    convenio: z.string().min(1, 'Escolha o convênio'),
    valor: z.number().positive('Informe o valor da sessão'),
    termos: z.boolean().refine((value) => value, 'É preciso aceitar os termos'),
});

type FormValues = z.input<typeof schema>;

/** Exemplo de formulário de tela v2: React Hook Form + Zod com campos do DS. */
export function ExampleForm() {
    const [submitted, setSubmitted] = useState<FormValues | null>(null);
    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: '',
            cpf: '',
            telefone: '',
            convenio: '',
            valor: 0,
            termos: false,
        },
    });

    return (
        <form
            noValidate
            onSubmit={handleSubmit((data) => setSubmitted(data))}
            className="grid w-full max-w-2xl gap-5 sm:grid-cols-2"
        >
            <DsInput
                label="Nome"
                {...register('nome')}
                state={errors.nome ? 'error' : 'default'}
                helper={errors.nome?.message}
            />
            <DsCpfField
                label="CPF"
                required
                {...register('cpf')}
                invalid={!!errors.cpf}
                helperText={errors.cpf?.message}
            />
            <Controller
                control={control}
                name="telefone"
                render={({ field, fieldState }) => (
                    <DsPhoneField
                        label="Telefone"
                        required
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        invalid={!!fieldState.error}
                        helperText={fieldState.error?.message}
                    />
                )}
            />
            <DsSelect
                label="Convênio"
                options={CONVENIOS}
                {...register('convenio')}
                state={errors.convenio ? 'error' : 'default'}
                helper={errors.convenio?.message}
            />
            <Controller
                control={control}
                name="valor"
                render={({ field, fieldState }) => (
                    <DsMoneyInput
                        label="Valor da sessão"
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onValueChange={(v) => field.onChange(v ?? 0)}
                        onBlur={field.onBlur}
                        state={fieldState.error ? 'error' : 'default'}
                        helper={fieldState.error?.message}
                    />
                )}
            />
            <Controller
                control={control}
                name="termos"
                render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-1 self-center">
                        <DsCheckbox
                            label="Aceito os termos"
                            name={field.name}
                            ref={field.ref}
                            checked={field.value === true}
                            onCheckedChange={(v) => field.onChange(v === true)}
                            onBlur={field.onBlur}
                        />
                        {fieldState.error && (
                            <span className="text-ds-caption text-ds-status-danger-content">
                                {fieldState.error.message}
                            </span>
                        )}
                    </div>
                )}
            />
            <div className="sm:col-span-2">
                <DsButton
                    type="submit"
                    label="Cadastrar"
                    loading={isSubmitting}
                />
            </div>
            {submitted && (
                <div
                    data-testid="resultado"
                    className="rounded-ds-md border border-ds-border-subtle bg-ds-surface-subtle p-4 sm:col-span-2"
                >
                    <p className="text-ds-caption text-ds-content-muted">
                        Enviado:
                    </p>
                    <pre className="mt-2 overflow-x-auto font-ds-mono text-ds-caption text-ds-content-primary">
                        {JSON.stringify(submitted, null, 2)}
                    </pre>
                </div>
            )}
        </form>
    );
}
