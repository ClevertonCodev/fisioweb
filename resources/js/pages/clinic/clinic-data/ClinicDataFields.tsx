import { Building2, User } from 'lucide-react';
import { useEffect } from 'react';
import type {
    Control,
    FieldErrors,
    UseFormRegister,
    UseFormSetValue,
    UseFormWatch,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { ClinicProfileFormValues } from '@/application/clinic/clinic-profile-form';
import { useCepLookup } from '@/application/clinic/use-cep-lookup';
import {
    applyMask,
    dsCn,
    DsFieldSelect,
    DsInput,
    formatCnpj,
    formatCpf,
} from '@/components/ds';

import { CLINIC_UFS, formatClinicPhone } from './clinic-data-ui';

type FormFields = {
    canEdit: boolean;
    control: Control<ClinicProfileFormValues>;
    errors: FieldErrors<ClinicProfileFormValues>;
    register: UseFormRegister<ClinicProfileFormValues>;
    setValue: UseFormSetValue<ClinicProfileFormValues>;
    watch: UseFormWatch<ClinicProfileFormValues>;
};

export function IdentityFields({
    canEdit,
    control,
    errors,
    register,
    setValue,
    watch,
}: FormFields) {
    const typePerson = watch('typePerson');

    const setTypePerson = (next: 'PF' | 'PJ') => {
        if (!canEdit) return;
        const current = watch('document');
        setValue('typePerson', next, {
            shouldDirty: true,
            shouldValidate: true,
        });
        setValue(
            'document',
            next === 'PF' ? formatCpf(current) : formatCnpj(current),
            { shouldDirty: true, shouldValidate: true },
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <DsInput
                label="Nome da clínica"
                {...register('name')}
                readonly={!canEdit}
                state={errors.name ? 'error' : 'default'}
                helper={errors.name?.message}
            />
            <div className="flex flex-col gap-1.5">
                <span className="text-ds-caption font-medium">Tipo</span>
                <div
                    role="radiogroup"
                    aria-label="Tipo de pessoa"
                    className="grid grid-cols-2 gap-2"
                >
                    {(
                        [
                            {
                                key: 'PJ',
                                label: 'Empresa (CNPJ)',
                                icon: <Building2 className="size-4" />,
                            },
                            {
                                key: 'PF',
                                label: 'Autônomo (CPF)',
                                icon: <User className="size-4" />,
                            },
                        ] as const
                    ).map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            role="radio"
                            aria-checked={typePerson === option.key}
                            disabled={!canEdit}
                            onClick={() => setTypePerson(option.key)}
                            className={dsCn(
                                'flex items-center justify-center gap-2 rounded-ds-md border px-3 py-2.5 text-ds-body-xs transition-colors',
                                typePerson === option.key
                                    ? 'border-ds-primary-80 bg-ds-surface-brand-subtle font-medium text-ds-content-brand ds-dark:border-ds-primary-60 ds-dark:text-ds-primary-40'
                                    : 'border-ds-border-default text-ds-content-secondary',
                                canEdit
                                    ? 'cursor-pointer hover:border-ds-border-strong'
                                    : 'opacity-70',
                            )}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
            <Controller
                control={control}
                name="document"
                render={({ field, fieldState }) => (
                    <DsInput
                        label={typePerson === 'PF' ? 'CPF' : 'CNPJ'}
                        value={field.value}
                        onValueChange={(value) =>
                            field.onChange(
                                typePerson === 'PF'
                                    ? formatCpf(value)
                                    : formatCnpj(value),
                            )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        readonly={!canEdit}
                        state={fieldState.error ? 'error' : 'default'}
                        helper={fieldState.error?.message}
                        inputMode="numeric"
                    />
                )}
            />
        </div>
    );
}

export function ContactFields({
    canEdit,
    control,
    errors,
    register,
}: Pick<FormFields, 'canEdit' | 'control' | 'errors' | 'register'>) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DsInput
                label="E-mail"
                type="email"
                {...register('email')}
                readonly={!canEdit}
                state={errors.email ? 'error' : 'default'}
                helper={
                    errors.email?.message ?? 'E-mail de contato da clínica.'
                }
            />
            <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                    <DsInput
                        label="Telefone / WhatsApp"
                        type="tel"
                        value={field.value}
                        onValueChange={(value) =>
                            field.onChange(formatClinicPhone(value))
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        readonly={!canEdit}
                        placeholder="(00) 00000-0000"
                        helper="Aparece no PDF do programa."
                    />
                )}
            />
        </div>
    );
}

export function AddressFields({
    canEdit,
    control,
    register,
    setValue,
    watch,
}: Pick<
    FormFields,
    'canEdit' | 'control' | 'register' | 'setValue' | 'watch'
>) {
    const zipCode = watch('zipCode');
    const { loading, lookup } = useCepLookup();

    useEffect(() => {
        if (!canEdit) return;

        let cancelled = false;
        lookup(zipCode ?? '').then((result) => {
            if (cancelled || !result) return;
            setValue('address', result.street, { shouldDirty: true });
            setValue('city', result.city, { shouldDirty: true });
            setValue('state', result.state, { shouldDirty: true });
        });

        return () => {
            cancelled = true;
        };
    }, [canEdit, lookup, setValue, zipCode]);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
                <Controller
                    control={control}
                    name="zipCode"
                    render={({ field, fieldState }) => (
                        <DsInput
                            label="CEP"
                            value={field.value}
                            onValueChange={(value) =>
                                field.onChange(
                                    applyMask(
                                        value.replace(/\D/g, ''),
                                        '#####-###',
                                    ),
                                )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            readonly={!canEdit}
                            inputMode="numeric"
                            placeholder="00000-000"
                            state={fieldState.error ? 'error' : 'default'}
                            helper={
                                fieldState.error?.message ??
                                (loading ? 'Buscando endereço…' : undefined)
                            }
                        />
                    )}
                />
            </div>
            <div className="sm:col-span-3">
                <DsInput
                    label="Rua"
                    {...register('address')}
                    readonly={!canEdit}
                />
            </div>
            <div className="sm:col-span-1">
                <DsInput
                    label="Número"
                    {...register('number')}
                    readonly={!canEdit}
                />
            </div>
            <div className="sm:col-span-4">
                <DsInput
                    label="Cidade"
                    {...register('city')}
                    readonly={!canEdit}
                />
            </div>
            <div className="sm:col-span-2">
                <Controller
                    control={control}
                    name="state"
                    render={({ field, fieldState }) => (
                        <DsFieldSelect
                            label="UF"
                            value={field.value}
                            onValueChange={(value) =>
                                field.onChange(String(value))
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            options={CLINIC_UFS.map((uf) => ({
                                value: uf,
                                label: uf,
                            }))}
                            placeholder="UF"
                            disabled={!canEdit}
                            state={fieldState.error ? 'error' : 'default'}
                            helper={fieldState.error?.message}
                        />
                    )}
                />
            </div>
        </div>
    );
}
