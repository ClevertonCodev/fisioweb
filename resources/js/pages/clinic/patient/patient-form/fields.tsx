import { Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Controller } from 'react-hook-form';

import type { PatientFormValues } from '@/application/clinic';
import { useCepLookup } from '@/application/clinic/use-cep-lookup';
import {
    DsButton,
    DsCheckbox,
    DsCpfField,
    DsDateField,
    DsFieldSelect,
    DsInput,
    DsPhoneField,
    DsSwitch,
    DsTextarea,
    type SelectOption,
} from '@/components/ds';

import { ageFromIso, type Form, type SectionKey } from './form';

type Field = keyof PatientFormValues;

const MARITAL_OPTIONS: SelectOption[] = [
    { value: 'solteiro', label: 'Solteiro(a)' },
    { value: 'casado', label: 'Casado(a)' },
    { value: 'divorciado', label: 'Divorciado(a)' },
    { value: 'viuvo', label: 'Viúvo(a)' },
];

const SEX_OPTIONS: SelectOption[] = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'feminino', label: 'Feminino' },
    { value: 'intersexo', label: 'Intersexo' },
];

const GENDER_OPTIONS: SelectOption[] = [
    { value: 'homem', label: 'Homem' },
    { value: 'mulher', label: 'Mulher' },
    { value: 'nao-binario', label: 'Não-binário' },
    { value: 'outro', label: 'Outro' },
];

const EDUCATION_OPTIONS: SelectOption[] = [
    { value: 'fundamental', label: 'Ensino Fundamental' },
    { value: 'medio', label: 'Ensino Médio' },
    { value: 'superior', label: 'Ensino Superior' },
    { value: 'pos', label: 'Pós-graduação' },
];

const SOURCE_OPTIONS: SelectOption[] = [
    { value: 'google', label: 'Google' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'indicacao_amigo', label: 'Indicação de amigo' },
    { value: 'indicacao_profissional', label: 'Indicação profissional' },
    { value: 'outro', label: 'Outro' },
];

const UF_OPTIONS: SelectOption[] = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
].map((uf) => ({ value: uf, label: uf }));

export function SectionTitle({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="mb-5">
            <h2 className="text-ds-h4 text-ds-content-primary">{title}</h2>
            {description && (
                <p className="mt-1 text-ds-body-xs text-ds-content-muted">
                    {description}
                </p>
            )}
        </div>
    );
}

function OutlinedSlot({
    hint,
    invalid,
    children,
}: {
    hint?: string;
    invalid: boolean;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1 pt-[25px] [&>div>div:first-child]:min-h-12 [&>div>div:first-child]:justify-center">
            {children}
            {!invalid && hint && (
                <span className="text-ds-caption text-ds-content-muted">
                    {hint}
                </span>
            )}
        </div>
    );
}

type StringField = {
    [K in Field]: PatientFormValues[K] extends string ? K : never;
}[Field];

export function SelectField({
    form,
    name,
    label,
    options,
    placeholder = 'Selecione',
    search = false,
}: {
    form: Form;
    name: StringField;
    label: string;
    options: SelectOption[];
    placeholder?: string;
    search?: boolean;
}) {
    return (
        <Controller
            control={form.control}
            name={name}
            render={({ field, fieldState }) => (
                <DsFieldSelect
                    label={label}
                    placeholder={placeholder}
                    mode={search ? 'search' : 'single'}
                    searchPlaceholder="Buscar…"
                    options={options}
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onValueChange={(v) =>
                        field.onChange(Array.isArray(v) ? (v[0] ?? '') : v)
                    }
                    onBlur={field.onBlur}
                    state={fieldState.error ? 'error' : 'default'}
                    helper={fieldState.error?.message}
                />
            )}
        />
    );
}

export function StatusField({
    form,
    options,
}: {
    form: Form;
    options: SelectOption[];
}) {
    return (
        <SelectField
            form={form}
            name="status"
            label="Situação do tratamento"
            options={options}
        />
    );
}

const GRID = 'grid gap-5 @xl:grid-cols-2 @5xl:grid-cols-3';

export function IdentityFields({ form }: { form: Form }) {
    const {
        register,
        control,
        watch,
        setValue,
        formState: { errors },
    } = form;
    const isForeign = watch('is_foreign');
    return (
        <div className="grid gap-5 @xl:grid-cols-2 @5xl:grid-cols-4">
            <div className="@xl:col-span-2">
                <DsInput
                    label="Nome completo"
                    required
                    placeholder="Como está no documento"
                    autocomplete="off"
                    {...register('name')}
                    state={errors.name ? 'error' : 'default'}
                    helper={errors.name?.message}
                />
            </div>
            <DsInput
                label="Apelido"
                placeholder="Opcional"
                {...register('apelido')}
            />
            <Controller
                control={control}
                name="use_apelido"
                render={({ field }) => (
                    <div className="self-center">
                        <DsSwitch
                            label="Usar apelido no sistema"
                            description="Aparece no lugar do nome nas telas"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            onBlur={field.onBlur}
                        />
                    </div>
                )}
            />
            <Controller
                control={control}
                name="is_foreign"
                render={({ field }) => (
                    <div className="self-center @xl:col-span-2 @5xl:col-span-1">
                        <DsSwitch
                            label="Pessoa estrangeira"
                            description="Troca o CPF por outro documento"
                            checked={field.value}
                            onCheckedChange={(v) => {
                                field.onChange(v);
                                setValue('cpf', '');
                            }}
                            onBlur={field.onBlur}
                        />
                    </div>
                )}
            />
            {isForeign ? (
                <DsInput
                    key="doc"
                    label="Documento"
                    required
                    placeholder="Passaporte ou RNE"
                    {...register('cpf')}
                    state={errors.cpf ? 'error' : 'default'}
                    helper={errors.cpf?.message}
                />
            ) : (
                <OutlinedSlot
                    key="cpf"
                    invalid={!!errors.cpf}
                    hint="Vira a senha inicial do app do paciente"
                >
                    <DsCpfField
                        label="CPF"
                        required
                        {...register('cpf')}
                        invalid={!!errors.cpf}
                        helperText={errors.cpf?.message}
                    />
                </OutlinedSlot>
            )}
            <Controller
                control={control}
                name="birth_date"
                render={({ field, fieldState }) => (
                    <DsDateField
                        label="Data de nascimento"
                        required
                        name={field.name}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        helper={(() => {
                            const age = ageFromIso(field.value);
                            return age === null
                                ? undefined
                                : `${age} ${age === 1 ? 'ano' : 'anos'}`;
                        })()}
                    />
                )}
            />
        </div>
    );
}

export function ProfileFields({ form }: { form: Form }) {
    const {
        register,
        formState: { errors },
    } = form;
    return (
        <div className="flex flex-col gap-5">
            <div className={GRID}>
                <SelectField
                    form={form}
                    name="marital_status"
                    label="Estado civil"
                    options={MARITAL_OPTIONS}
                />
                <DsInput
                    label="Profissão"
                    placeholder="Ex.: Professora"
                    {...register('profession')}
                />
                <SelectField
                    form={form}
                    name="biological_sex"
                    label="Sexo biológico"
                    options={SEX_OPTIONS}
                />
                <SelectField
                    form={form}
                    name="gender"
                    label="Gênero"
                    options={GENDER_OPTIONS}
                />
                <SelectField
                    form={form}
                    name="education"
                    label="Escolaridade"
                    options={EDUCATION_OPTIONS}
                />
            </div>
            <DsTextarea
                label="Resumo do diagnóstico"
                placeholder="Ex.: Lombalgia crônica pós-cirúrgica"
                rows={3}
                maxlength={500}
                {...register('diagnosis')}
                state={errors.diagnosis ? 'error' : 'default'}
                helper={errors.diagnosis?.message}
            />
        </div>
    );
}

export function ContactFields({ form }: { form: Form }) {
    const {
        register,
        control,
        formState: { errors },
    } = form;
    return (
        <div className={GRID}>
            <Controller
                control={control}
                name="phone"
                render={({ field, fieldState }) => (
                    <OutlinedSlot
                        invalid={!!fieldState.error}
                        hint="Recebe os lembretes da clínica"
                    >
                        <DsPhoneField
                            label="Celular (WhatsApp)"
                            required
                            showCountrySelector={false}
                            name={field.name}
                            ref={field.ref}
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            invalid={!!fieldState.error}
                            helperText={fieldState.error?.message}
                        />
                    </OutlinedSlot>
                )}
            />
            <DsInput
                label="E-mail"
                required
                type="email"
                placeholder="email@exemplo.com"
                {...register('email')}
                state={errors.email ? 'error' : 'default'}
                helper={errors.email?.message ?? 'Usado no acesso ao app'}
            />
        </div>
    );
}

function maskCep(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 8);
    return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function AddressFields({ form }: { form: Form }) {
    const { register, control, setValue, watch } = form;
    const noNumber = watch('address_no_number');
    const { loading, lookup } = useCepLookup();
    const [cepMessage, setCepMessage] = useState<string | null>(null);

    const onCepChange = (masked: string) => {
        setCepMessage(null);
        if (masked.replace(/\D/g, '').length !== 8) return;
        void lookup(masked).then((result) => {
            if (watch('zip_code') !== masked) return;
            if (!result) {
                setCepMessage('CEP não encontrado. Preencha à mão.');
                return;
            }
            setCepMessage(`${result.city}/${result.state}`);
            setValue('address_street', result.street);
            setValue('neighborhood', result.neighborhood);
            setValue('city', result.city);
            setValue('state', result.state);
        });
    };

    return (
        <div className="grid gap-5 @xl:grid-cols-6 @5xl:grid-cols-12">
            <div className="@xl:col-span-2">
                <Controller
                    control={control}
                    name="zip_code"
                    render={({ field }) => (
                        <DsInput
                            label="CEP"
                            placeholder="00000-000"
                            inputMode="numeric"
                            name={field.name}
                            ref={field.ref}
                            value={field.value}
                            onValueChange={(v) => {
                                const masked = maskCep(v);
                                field.onChange(masked);
                                onCepChange(masked);
                            }}
                            onBlur={field.onBlur}
                            helper={
                                loading
                                    ? 'Buscando…'
                                    : (cepMessage ?? undefined)
                            }
                        />
                    )}
                />
            </div>
            <div className="@xl:col-span-4 @5xl:col-span-6">
                <DsInput
                    label="Rua / Avenida"
                    {...register('address_street')}
                />
            </div>
            <div className="@xl:col-span-2">
                <Controller
                    control={control}
                    name="address_number"
                    render={({ field }) => (
                        <DsInput
                            label="Número"
                            inputMode="numeric"
                            disabled={noNumber}
                            name={field.name}
                            ref={field.ref}
                            value={field.value}
                            onValueChange={(v) =>
                                field.onChange(v.replace(/\D/g, '').slice(0, 6))
                            }
                            onBlur={field.onBlur}
                        />
                    )}
                />
            </div>
            <Controller
                control={control}
                name="address_no_number"
                render={({ field }) => (
                    <div className="self-end pb-2.5 @xl:col-span-1 @5xl:col-span-2">
                        <DsCheckbox
                            label="Sem número"
                            checked={field.value}
                            onCheckedChange={(v) => {
                                field.onChange(v === true);
                                if (v === true) setValue('address_number', '');
                            }}
                            onBlur={field.onBlur}
                        />
                    </div>
                )}
            />
            <div className="@xl:col-span-3 @5xl:col-span-4">
                <DsInput
                    label="Complemento"
                    placeholder="Apto, bloco… (opcional)"
                    {...register('address_complement')}
                />
            </div>
            <div className="@xl:col-span-2 @5xl:col-span-3">
                <DsInput label="Bairro" {...register('neighborhood')} />
            </div>
            <div className="@xl:col-span-3">
                <DsInput label="Cidade" {...register('city')} />
            </div>
            <div className="@xl:col-span-1 @5xl:col-span-2">
                <SelectField
                    form={form}
                    name="state"
                    label="UF"
                    placeholder="UF"
                    options={UF_OPTIONS}
                    search
                />
            </div>
        </div>
    );
}

export function InsuranceFields({ form }: { form: Form }) {
    const { register, control, watch } = form;
    const hasInsurance = watch('has_insurance');
    return (
        <div className="flex flex-col gap-5">
            <Controller
                control={control}
                name="has_insurance"
                render={({ field }) => (
                    <DsSwitch
                        label="Atendido por convênio"
                        description="Desligado = particular"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        onBlur={field.onBlur}
                    />
                )}
            />
            {hasInsurance && (
                <div className={GRID}>
                    <DsInput
                        label="Convênio"
                        placeholder="Nome do convênio"
                        {...register('insurance')}
                    />
                    <DsInput
                        label="Número da carteirinha"
                        {...register('insurance_number')}
                    />
                </div>
            )}
        </div>
    );
}

export function SourceFields({ form }: { form: Form }) {
    return (
        <div className="flex flex-col gap-5">
            <div className={GRID}>
                <SelectField
                    form={form}
                    name="referral_source"
                    label="Como conheceu a clínica"
                    options={SOURCE_OPTIONS}
                />
            </div>
            <ReferralFields />
        </div>
    );
}

/** Ainda não grava: não existe campo no backend. */
export function ReferralFields() {
    return (
        <div className="flex flex-col gap-3 rounded-ds-md border border-dashed border-ds-border-default p-4">
            <div>
                <p className="text-ds-body-xs font-medium text-ds-content-secondary">
                    Indicação de profissional da saúde
                </p>
                <p className="text-ds-caption text-ds-content-muted">
                    Ainda não grava (igual à tela anterior).
                </p>
            </div>
            <div>
                <DsButton
                    variant="secondary"
                    size="sm"
                    iconPosition="left"
                    icon={<Plus />}
                    label="Adicionar profissional da saúde"
                    disabled
                />
            </div>
        </div>
    );
}

export function SectionFields({
    section,
    form,
}: {
    section: SectionKey;
    form: Form;
}) {
    switch (section) {
        case 'identificacao':
            return <IdentityFields form={form} />;
        case 'perfil':
            return <ProfileFields form={form} />;
        case 'contato':
            return <ContactFields form={form} />;
        case 'endereco':
            return <AddressFields form={form} />;
        case 'convenio':
            return <InsuranceFields form={form} />;
        case 'origem':
            return <SourceFields form={form} />;
    }
}
