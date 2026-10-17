import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Camera, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
    Controller,
    useForm,
    type FieldErrors,
    type UseFormReturn,
} from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
    patientFormDefaults,
    patientFormSchema,
    toPatientWriteDto,
    type PatientFormValues,
} from '@/application/clinic';
import { useCepLookup } from '@/application/clinic/use-cep-lookup';
import {
    DsButton,
    DsCheckbox,
    DsCpfField,
    DsFieldSelect,
    DsInput,
    DsModal,
    DsPhoneField,
    DsRadio,
    DsRadioGroup,
    DsSwitch,
    DsTextarea,
    dsCn,
    getPhoneValidationError,
    type SelectOption,
} from '@/components/ds';
import type { PrototypeVariant } from '@/pages/clinic/agenda-prototype/PrototypeSwitcher';

import { DateField } from './DateField';

/*
 * PROTOTYPE (throwaway) — peças compartilhadas pelas variantes do cadastro de
 * paciente no DS v2. Os campos são os mesmos da tela atual (patientFormSchema);
 * cada variante só muda o arranjo. O envio é stub: mostra o payload e não grava.
 */

export const PATIENT_NEW_PROTOTYPE_VARIANTS: readonly PrototypeVariant[] = [
    { key: 'O', name: 'Original v1' },
    { key: 'A', name: 'Abas' },
    { key: 'B', name: 'Página única + índice' },
    { key: 'C', name: 'Assistente em etapas' },
    { key: 'D', name: 'Cadastro rápido' },
];

export const PATIENTS_PATH = '/clinica/pacientes';

export type Form = UseFormReturn<PatientFormValues>;
type Field = keyof PatientFormValues;

// ─── Seções (as mesmas abas da tela atual, com Perfil separado) ──────────────

export type SectionKey =
    | 'identificacao'
    | 'perfil'
    | 'contato'
    | 'endereco'
    | 'convenio'
    | 'origem';

export const SECTIONS: { key: SectionKey; label: string; hint: string }[] = [
    {
        key: 'identificacao',
        label: 'Identificação',
        hint: 'Foto, nome, documento e nascimento',
    },
    {
        key: 'perfil',
        label: 'Perfil e diagnóstico',
        hint: 'Estado civil, profissão, sexo, gênero',
    },
    { key: 'contato', label: 'Contato', hint: 'Telefone e e-mail' },
    { key: 'endereco', label: 'Endereço', hint: 'CEP preenche o resto' },
    { key: 'convenio', label: 'Convênio', hint: 'Plano de saúde' },
    {
        key: 'origem',
        label: 'Como conheceu',
        hint: 'Indicação e canal de origem',
    },
];

export const SECTION_FIELDS: Record<SectionKey, Field[]> = {
    identificacao: [
        'status',
        'is_foreign',
        'name',
        'apelido',
        'use_apelido',
        'cpf',
        'birth_date',
    ],
    perfil: [
        'marital_status',
        'profession',
        'biological_sex',
        'gender',
        'education',
        'diagnosis',
    ],
    contato: ['phone', 'email'],
    endereco: [
        'zip_code',
        'address_street',
        'address_number',
        'address_no_number',
        'address_complement',
        'neighborhood',
        'city',
        'state',
    ],
    convenio: ['has_insurance', 'insurance', 'insurance_number'],
    origem: ['referral_source'],
};

export const REQUIRED_FIELDS: Field[] = [
    'name',
    'cpf',
    'birth_date',
    'phone',
    'email',
];

export function sectionErrorCount(
    section: SectionKey,
    errors: FieldErrors<PatientFormValues>,
): number {
    return SECTION_FIELDS[section].filter((f) => !!errors[f]).length;
}

export function firstSectionWithError(
    errors: FieldErrors<PatientFormValues>,
): SectionKey | null {
    return (
        SECTIONS.find((s) => sectionErrorCount(s.key, errors) > 0)?.key ?? null
    );
}

// ─── Opções ──────────────────────────────────────────────────────────────────

/** Só as situações de quem está chegando (sem Alta, Cancelado e Óbito). */
export const STATUS_OPTIONS: SelectOption[] = [
    { value: 'em_tratamento', label: 'Em tratamento' },
    { value: 'em_treinamento', label: 'Em treinamento' },
    { value: 'em_prevencao', label: 'Em prevenção' },
];

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

export function optionLabel(
    options: SelectOption[],
    value: string,
): string | undefined {
    return options.find((o) => o.value === value)?.label;
}

export const LABELS = {
    status: STATUS_OPTIONS,
    marital: MARITAL_OPTIONS,
    sex: SEX_OPTIONS,
    gender: GENDER_OPTIONS,
    education: EDUCATION_OPTIONS,
    source: SOURCE_OPTIONS,
};

// ─── Hook do formulário (stub no envio) ──────────────────────────────────────

/** O schema real + a validação de telefone do DsPhoneField. */
const prototypeSchema = patientFormSchema.superRefine((data, ctx) => {
    const error = data.phone ? getPhoneValidationError(data.phone) : '';
    if (error) {
        ctx.addIssue({ code: 'custom', message: error, path: ['phone'] });
    }
});

/** Obrigatórios ainda vazios ou inválidos (pelo schema, sem esperar o blur). */
export function pendingRequired(values: PatientFormValues): Field[] {
    const result = prototypeSchema.safeParse(values);
    if (result.success) return [];
    const bad = new Set(result.error.issues.map((i) => i.path[0]));
    return REQUIRED_FIELDS.filter((f) => bad.has(f));
}

export function usePatientNewPrototype() {
    const navigate = useNavigate();
    const form = useForm<PatientFormValues>({
        resolver: zodResolver(prototypeSchema),
        defaultValues: patientFormDefaults,
        mode: 'onTouched',
    });
    const [photo, setPhoto] = useState<File | null>(null);
    const [payload, setPayload] = useState<ReturnType<
        typeof toPatientWriteDto
    > | null>(null);

    /** `onInvalid` recebe os erros para a variante levar o usuário até eles. */
    const submit = (
        onInvalid?: (errors: FieldErrors<PatientFormValues>) => void,
    ) =>
        form.handleSubmit(
            (data) => setPayload(toPatientWriteDto(data)),
            (errors) => {
                toast.error('Confira os campos destacados.');
                onInvalid?.(errors);
            },
        );

    return {
        form,
        photo,
        setPhoto,
        payload,
        closePayload: () => setPayload(null),
        submit,
        cancel: () => navigate(PATIENTS_PATH),
    };
}

export type PrototypeState = ReturnType<typeof usePatientNewPrototype>;

/** Resultado do envio stub: o que iria para a API, sem gravar. */
export function PayloadModal({ state }: { state: PrototypeState }) {
    return (
        <DsModal
            open={state.payload !== null}
            onOpenChange={(open) => !open && state.closePayload()}
            title="Protótipo: nada foi gravado"
            size="md"
            footer={
                <div className="flex w-full justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Voltar ao formulário"
                        onClick={state.closePayload}
                    />
                    <DsButton label="Ir para a lista" onClick={state.cancel} />
                </div>
            }
        >
            <p className="text-ds-body-sm text-ds-content-secondary">
                Na tela real, isto iria para <code>POST /clinic/patients</code>
                {state.photo ? ' e a foto seria enviada em seguida' : ''}.
            </p>
            <pre className="mt-3 max-h-[50vh] overflow-auto rounded-ds-md bg-ds-surface-subtle p-3 font-ds-mono text-ds-caption text-ds-content-primary">
                {JSON.stringify(state.payload, null, 2)}
            </pre>
        </DsModal>
    );
}

// ─── Cabeçalho comum (título + voltar) ───────────────────────────────────────

export function PageHeader({
    state,
    subtitle = 'Preencha os dados do paciente. Campos com * são obrigatórios.',
    actions,
}: {
    state: PrototypeState;
    subtitle?: string;
    actions?: ReactNode;
}) {
    return (
        <header className="flex flex-wrap items-start gap-4">
            <DsButton
                variant="tertiary"
                iconPosition="only"
                icon={<ArrowLeft />}
                label="Voltar para pacientes"
                onClick={state.cancel}
            />
            <div className="mr-auto min-w-0">
                <h1 className="text-ds-page-title">Novo paciente</h1>
                <p className="mt-1 text-ds-body-sm text-ds-content-secondary">
                    {subtitle}
                </p>
            </div>
            {actions}
        </header>
    );
}

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

// ─── Foto ────────────────────────────────────────────────────────────────────

const PHOTO_MIMES: readonly string[] = [
    'image/jpeg',
    'image/png',
    'image/webp',
];
const PHOTO_MAX = 2 * 1024 * 1024;

function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase();
}

function usePhotoPreview(photo: File | null): string | null {
    const preview = useMemo(
        () => (photo ? URL.createObjectURL(photo) : null),
        [photo],
    );
    useEffect(
        () => () => {
            if (preview) URL.revokeObjectURL(preview);
        },
        [preview],
    );
    return preview;
}

/** Só a bolinha (foto ou iniciais), sem botões. */
export function AvatarPreview({
    state,
    size = 44,
}: {
    state: PrototypeState;
    size?: number;
}) {
    const preview = usePhotoPreview(state.photo);
    const initials = initialsOf(state.form.watch('name'));
    return (
        <span
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-ds-full bg-ds-surface-brand-subtle font-semibold text-ds-content-brand ds-dark:text-ds-primary-60"
            style={{ width: size, height: size, fontSize: size * 0.38 }}
        >
            {preview ? (
                <img src={preview} alt="" className="size-full object-cover" />
            ) : (
                initials || '?'
            )}
        </span>
    );
}

/** Foto do paciente. Protótipo: sem o recorte da tela atual. */
export function PhotoField({
    state,
    size = 96,
    layout = 'row',
}: {
    state: PrototypeState;
    size?: number;
    layout?: 'row' | 'stack';
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const name = state.form.watch('name');
    const preview = usePhotoPreview(state.photo);

    const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!PHOTO_MIMES.includes(file.type)) {
            setError('Use JPEG, PNG ou WebP.');
            return;
        }
        if (file.size > PHOTO_MAX) {
            setError('A foto não pode passar de 2 MB.');
            return;
        }
        state.setPhoto(file);
    };

    const initials = initialsOf(name);

    return (
        <div
            className={dsCn(
                'flex gap-4',
                layout === 'row'
                    ? 'items-center'
                    : 'flex-col items-center text-center',
            )}
        >
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                aria-label="Escolher foto do paciente"
                className="group relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-ds-full border border-dashed border-ds-border-default bg-ds-surface-brand-subtle font-semibold text-ds-content-brand transition-colors hover:border-ds-primary-60 focus-visible:shadow-ds-focus focus-visible:outline-0 ds-dark:text-ds-primary-60"
                style={{ width: size, height: size, fontSize: size * 0.34 }}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt=""
                        className="size-full object-cover"
                    />
                ) : initials ? (
                    initials
                ) : (
                    <Camera className="size-[38%] text-ds-content-subtle" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-ds-black/40 text-ds-white opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="size-6" />
                </span>
            </button>
            <div className="flex flex-col gap-1.5">
                <div
                    className={dsCn(
                        'flex flex-wrap gap-2',
                        layout === 'stack' && 'justify-center',
                    )}
                >
                    <DsButton
                        variant="secondary"
                        size="sm"
                        label={state.photo ? 'Trocar foto' : 'Escolher foto'}
                        onClick={() => inputRef.current?.click()}
                    />
                    {state.photo && (
                        <DsButton
                            variant="destructive-tertiary"
                            size="sm"
                            iconPosition="left"
                            icon={<Trash2 />}
                            label="Remover"
                            onClick={() => state.setPhoto(null)}
                        />
                    )}
                </div>
                <span
                    className={dsCn(
                        'text-ds-caption',
                        error
                            ? 'text-ds-status-danger-content'
                            : 'text-ds-content-muted',
                    )}
                >
                    {error ?? 'JPEG, PNG ou WebP, até 2 MB. Opcional.'}
                </span>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept={PHOTO_MIMES.join(',')}
                className="hidden"
                onChange={pick}
            />
        </div>
    );
}

// ─── Encaixe dos campos de rótulo na borda (DsCpfField, DsPhoneField) ───────

/**
 * Os campos com rótulo na borda têm 45px e só mostram ajuda no erro; o
 * DsInput tem o rótulo em cima (25px) e 48px. Este encaixe alinha os dois lado
 * a lado e mostra a dica fora do erro. Achado do protótipo: levar para o DS.
 */
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

// ─── Select do DS ligado ao RHF ──────────────────────────────────────────────

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
    /** Lista com busca (ex.: UF). */
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

// ─── Status ──────────────────────────────────────────────────────────────────

export function StatusField({
    form,
    as = 'select',
}: {
    form: Form;
    as?: 'select' | 'radio';
}) {
    if (as === 'select') {
        return (
            <SelectField
                form={form}
                name="status"
                label="Situação do tratamento"
                options={STATUS_OPTIONS}
            />
        );
    }
    return (
        <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
                <div className="flex flex-col gap-2">
                    <span className="text-ds-body-xs font-medium text-ds-content-secondary">
                        Situação do tratamento
                    </span>
                    <DsRadioGroup
                        aria-label="Situação do tratamento"
                        orientation="horizontal"
                        value={field.value}
                        onValueChange={(v) => field.onChange(String(v))}
                        onBlur={field.onBlur}
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <DsRadio
                                key={o.value}
                                value={String(o.value)}
                                label={o.label}
                            />
                        ))}
                    </DsRadioGroup>
                </div>
            )}
        />
    );
}

// ─── Idade ───────────────────────────────────────────────────────────────────

export function ageFromIso(iso: string): number | null {
    if (!iso) return null;
    const birth = new Date(`${iso}T00:00:00`);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
}

// ─── Blocos de campos ────────────────────────────────────────────────────────

/** Nome, apelido, documento e nascimento. */
/*
 * Os grids usam container queries (@xl, @5xl): a quantidade de colunas segue a
 * largura do cartão, não a da janela. Quem usa precisa de um `@container`.
 */
const GRID = 'grid gap-5 @xl:grid-cols-2 @5xl:grid-cols-3';

export function IdentityFields({
    form,
    showForeign = true,
    showNickname = true,
}: {
    form: Form;
    showForeign?: boolean;
    showNickname?: boolean;
}) {
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
            {showNickname && (
                <>
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
                </>
            )}
            {showForeign && (
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
            )}
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
                    <DateField
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

/** Estado civil, profissão, sexo, gênero, escolaridade, diagnóstico. */
export function ProfileFields({
    form,
    showDiagnosis = true,
}: {
    form: Form;
    showDiagnosis?: boolean;
}) {
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
            {showDiagnosis && <DiagnosisField form={form} errors={errors} />}
        </div>
    );
}

export function DiagnosisField({
    form,
    errors = form.formState.errors,
}: {
    form: Form;
    errors?: FieldErrors<PatientFormValues>;
}) {
    return (
        <DsTextarea
            label="Resumo do diagnóstico"
            placeholder="Ex.: Lombalgia crônica pós-cirúrgica"
            rows={3}
            maxlength={500}
            {...form.register('diagnosis')}
            state={errors.diagnosis ? 'error' : 'default'}
            helper={errors.diagnosis?.message}
        />
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

    // Busca no ViaCEP ao completar os 8 dígitos (no evento, não num efeito).
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
        // 6 colunas no cartão médio, 12 no largo:
        // CEP · Rua · Número · Sem número / Complemento · Bairro · Cidade · UF.
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

/** Igual à tela atual: ainda não grava nada (não existe campo no backend). */
export function ReferralFields() {
    return (
        <div className="flex flex-col gap-3 rounded-ds-md border border-dashed border-ds-border-default p-4">
            <div>
                <p className="text-ds-body-xs font-medium text-ds-content-secondary">
                    Indicação de profissional da saúde
                </p>
                <p className="text-ds-caption text-ds-content-muted">
                    Ainda não grava (igual à tela atual). Decidir se fica.
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

/** Uma seção inteira pela chave (usado pelas variantes A e B). */
export function SectionFields({
    section,
    state,
}: {
    section: SectionKey;
    state: PrototypeState;
}) {
    const { form } = state;
    switch (section) {
        case 'identificacao':
            return (
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-between gap-5">
                        <PhotoField state={state} />
                        <div className="w-full sm:w-56">
                            <StatusField form={form} />
                        </div>
                    </div>
                    <IdentityFields form={form} />
                </div>
            );
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
