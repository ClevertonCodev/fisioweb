/**
 * Formulário de paciente da clínica, em dois modos: cadastro (situação
 * só de quem chega) e edição (todas as situações). Quem grava é a página,
 * pelo `onSave`; erro 422 volta para os campos e a aba com erro.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import {
    PATIENT_STATUS_OPTIONS,
    patientFormDefaults,
    patientFormSchema,
    type PatientFormValues,
} from '@/application/clinic';
import { getValidationErrors } from '@/application/clinic/validation-errors';
import { getPhoneValidationError, type SelectOption } from '@/components/ds';

export const PATIENTS_PATH = '/clinica/pacientes';

export type Form = UseFormReturn<PatientFormValues>;
type Field = keyof PatientFormValues;

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

export const REQUIRED_LABELS: Record<string, string> = {
    name: 'Nome',
    cpf: 'Documento',
    birth_date: 'Data de nascimento',
    phone: 'Celular',
    email: 'E-mail',
};

/** Só as situações de quem está chegando (sem Alta, Cancelado e Óbito). */
export const CREATE_STATUS_OPTIONS: SelectOption[] = [
    { value: 'em_tratamento', label: 'Em tratamento' },
    { value: 'em_treinamento', label: 'Em treinamento' },
    { value: 'em_prevencao', label: 'Em prevenção' },
];

export const EDIT_STATUS_OPTIONS: SelectOption[] = PATIENT_STATUS_OPTIONS;

const FIELDS_WITH_ERROR = [
    'name',
    'cpf',
    'birth_date',
    'phone',
    'email',
    'apelido',
    'marital_status',
    'profession',
    'biological_sex',
    'gender',
    'education',
    'status',
    'diagnosis',
    'zip_code',
    'address_street',
    'address_number',
    'address_complement',
    'neighborhood',
    'city',
    'state',
    'insurance',
    'insurance_number',
    'referral_source',
] as const;

const formSchema = patientFormSchema.superRefine((data, ctx) => {
    const error = data.phone ? getPhoneValidationError(data.phone) : '';
    if (error) {
        ctx.addIssue({ code: 'custom', message: error, path: ['phone'] });
    }
});

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

/** Obrigatórios ainda vazios ou inválidos (pelo schema, sem esperar o blur). */
export function ageFromIso(iso: string): number | null {
    if (!iso) return null;
    const birth = new Date(`${iso}T00:00:00`);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
}

export function pendingRequired(values: PatientFormValues): Field[] {
    const result = formSchema.safeParse(values);
    if (result.success) return [];
    const bad = new Set(result.error.issues.map((i) => i.path[0]));
    return REQUIRED_FIELDS.filter((f) => bad.has(f));
}

export interface PhotoChange {
    file: File | null;
    removed: boolean;
}

type SavePatient = (
    values: PatientFormValues,
    photo: PhotoChange,
) => Promise<void>;

export type PatientFormMode =
    | { mode: 'create'; onSave: SavePatient; onCancel: () => void }
    | {
          mode: 'edit';
          defaultValues: PatientFormValues;
          savedPhotoUrl?: string | null;
          onSave: SavePatient;
          onCancel: () => void;
      };

export function usePatientForm(options: PatientFormMode) {
    const defaultValues =
        options.mode === 'edit' ? options.defaultValues : patientFormDefaults;
    const savedPhoto =
        options.mode === 'edit' ? (options.savedPhotoUrl ?? null) : null;

    const form = useForm<PatientFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: 'onTouched',
    });

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoChanged, setPhotoChanged] = useState(false);

    const setPhoto = (file: File | null) => {
        setPhotoFile(file);
        setPhotoChanged(true);
    };

    const submit = (
        onInvalid?: (errors: FieldErrors<PatientFormValues>) => void,
    ) =>
        form.handleSubmit(
            async (values) => {
                try {
                    await options.onSave(values, {
                        file: photoFile,
                        removed: photoChanged && !photoFile && !!savedPhoto,
                    });
                } catch (error) {
                    const invalid = getValidationErrors(error);
                    if (!invalid) return;
                    const leftover: string[] = [];
                    const serverErrors: FieldErrors<PatientFormValues> = {};
                    for (const [key, messages] of Object.entries(
                        invalid.fields,
                    )) {
                        if (!messages[0]) continue;
                        if (
                            (FIELDS_WITH_ERROR as readonly string[]).includes(
                                key,
                            )
                        ) {
                            const field =
                                key as (typeof FIELDS_WITH_ERROR)[number];
                            form.setError(field, { message: messages[0] });
                            serverErrors[field] = {
                                type: 'server',
                                message: messages[0],
                            };
                        } else {
                            leftover.push(messages[0]);
                        }
                    }
                    if (leftover.length > 0) toast.error(leftover.join(' '));
                    else if (Object.keys(invalid.fields).length === 0) {
                        toast.error(invalid.message ?? 'Confira os dados.');
                    }
                    onInvalid?.(serverErrors);
                }
            },
            (errors) => {
                toast.error('Confira os campos destacados.');
                onInvalid?.(errors);
            },
        );

    return {
        mode: options.mode,
        submitting: form.formState.isSubmitting,
        form,
        photoFile,
        savedPhoto: photoChanged && !photoFile ? null : savedPhoto,
        setPhoto,
        statusOptions:
            options.mode === 'create'
                ? CREATE_STATUS_OPTIONS
                : EDIT_STATUS_OPTIONS,
        submit,
        cancel: options.onCancel,
    };
}

export type PatientFormState = ReturnType<typeof usePatientForm>;
