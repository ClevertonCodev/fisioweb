/**
 * O formulário de usuário da clínica, em dois modos: cadastro (esquema de
 * novo usuário, senha e função obrigatórias) e edição (esquema de editar,
 * senha opcional). Quem grava é a página, pelo `onSave`; erro 422 volta
 * para os campos.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';

import {
    clinicUserEditFormSchema,
    clinicUserNewFormSchema,
    type ClinicUserFormRole,
    type ClinicUserFormStatus,
    type ClinicUserNewFormValues,
} from '@/application/clinic/clinic-user-form';
import { getClinicUserPhotoValidationError } from '@/application/clinic/clinic-user-photo-rules';
import { getValidationErrors } from '@/application/clinic/validation-errors';
import { formatCnpj, formatCpf } from '@/components/ds';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import {
    documentStoredValueForForm,
    inferClinicUserDocumentKind,
    type ClinicUserDocumentKind,
} from '@/lib/br-document-validation';

export const DOCUMENT_KIND_LABEL: Record<ClinicUserDocumentKind, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    crefito: 'CREFITO',
};

export function maskDocument(kind: ClinicUserDocumentKind, raw: string) {
    if (kind === 'cpf') return formatCpf(raw);
    if (kind === 'cnpj') return formatCnpj(raw);
    return raw;
}

/**
 * Valores do formulário nos dois modos. A função começa vazia no cadastro;
 * na edição, ela vem do usuário.
 */
export type UserFormValues = ClinicUserNewFormValues;

export const FIELD_LABEL: Record<keyof UserFormValues, string> = {
    name: 'Nome',
    email: 'E-mail',
    password: 'Senha',
    confirmPassword: 'Confirmação da senha',
    role: 'Função',
    status: 'Situação',
    documentKind: 'Tipo de documento',
    document: 'Documento',
};

export interface PhotoState {
    /** URL mostrada (nova, atual ou null). */
    url: string | null;
    /** Arquivo escolhido nesta tela (null = nenhum novo). */
    file: File | null;
    changed: boolean;
}

/** Campos que mostram o próprio erro na tela (os outros vão para o toast). */
const FIELDS_WITH_ERROR = [
    'name',
    'email',
    'password',
    'confirmPassword',
    'role',
    'document',
] as const;

export interface Change {
    key: string;
    label: string;
    from: string;
    to: string;
}

/** 0–4: tamanho, número, maiúscula e símbolo. */
export function passwordScore(pwd: string): number {
    if (!pwd) return 0;
    let s = pwd.length >= 8 ? 1 : 0;
    if (/\d/.test(pwd)) s += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s += 1;
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) s += 1;
    return pwd.length < 8 ? Math.min(s, 1) : s;
}

export const SCORE_LABEL = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];

/** O que mudou na foto: arquivo novo, ou a atual removida. */
export interface PhotoChange {
    file: File | null;
    removed: boolean;
}

/** Grava o usuário (e a foto). Erro 422 volta aos campos. */
type SaveUser = (values: UserFormValues, photo: PhotoChange) => Promise<void>;

export type UserFormMode =
    | { mode: 'create'; onSave: SaveUser }
    | {
          mode: 'edit';
          user: ClinicUserSummary;
          role: ClinicUserFormRole;
          roleLabel: (r: ClinicUserFormRole) => string;
          onSave: SaveUser;
      };

const EMPTY_VALUES: UserFormValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: undefined,
    status: '1',
    documentKind: 'cpf',
    document: '',
};

export function useUserForm(options: UserFormMode) {
    const user = options.mode === 'edit' ? options.user : null;
    const role = options.mode === 'edit' ? options.role : undefined;
    const defaultValues = useMemo<UserFormValues>(() => {
        if (!user) return EMPTY_VALUES;
        const kind = inferClinicUserDocumentKind(user.document);
        return {
            name: user.name,
            email: user.email,
            password: '',
            confirmPassword: '',
            role,
            status: (user.status ? '1' : '0') as ClinicUserFormStatus,
            documentKind: kind,
            document: maskDocument(
                kind,
                documentStoredValueForForm(kind, user.document),
            ),
        };
    }, [user, role]);

    const form = useForm<UserFormValues>({
        // Mesmos campos; o de novo usuário exige senha e confirmação, o de
        // editar aceita a senha em branco.
        resolver: zodResolver(
            options.mode === 'edit'
                ? clinicUserEditFormSchema
                : clinicUserNewFormSchema,
        ) as Resolver<UserFormValues>,
        defaultValues,
        mode: 'onTouched',
    });
    const values = useWatch({
        control: form.control,
    }) as UserFormValues;
    // O mestre não se desativa (o backend recusa). Um mestre que a v1
    // deixou desativar abre com a situação em "ativo", mas a base continua
    // a real: a comparação com ela mostra a reativação como alteração e
    // habilita o Salvar. Antes de pintar (e depois do useWatch, que assina num layout effect), para o crachá não piscar inativo.
    useLayoutEffect(() => {
        if (user?.mestre === 1 && !user.status) form.setValue('status', '1');
    }, [form, user]);
    const base = (form.formState.defaultValues ??
        defaultValues) as UserFormValues;

    const savedPhoto = user?.photoUrl ?? null;
    const [photo, setPhotoState] = useState<PhotoState>({
        url: user?.photoUrl ?? null,
        file: null,
        changed: false,
    });
    const [photoError, setPhotoError] = useState<string | null>(null);
    // Prévia escolhida nesta tela (blob:): liberada ao trocar e ao sair.
    const previewUrl = photo.file ? photo.url : null;
    useEffect(
        () => () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        },
        [previewUrl],
    );
    const setPhoto = (file: File | null) => {
        const problem = file ? getClinicUserPhotoValidationError(file) : null;
        setPhotoError(problem);
        if (problem) return;
        setPhotoState({
            url: file ? URL.createObjectURL(file) : null,
            file,
            changed: true,
        });
    };

    const show = (key: keyof UserFormValues, v: UserFormValues) => {
        if (key === 'role') {
            return v.role && options.mode === 'edit'
                ? options.roleLabel(v.role)
                : '—';
        }
        if (key === 'status') return v.status === '1' ? 'Ativo' : 'Inativo';
        if (key === 'documentKind') return DOCUMENT_KIND_LABEL[v.documentKind];
        if (key === 'password') return v.password ? '••••••••' : '—';
        return String(v[key] ?? '') || '—';
    };

    // No cadastro não há base para comparar: nada conta como alteração.
    const changes: Change[] = [];
    if (options.mode === 'edit') {
        for (const key of [
            'name',
            'email',
            'role',
            'status',
            'documentKind',
            'document',
        ] as const) {
            if (values[key] !== base[key]) {
                changes.push({
                    key,
                    label: FIELD_LABEL[key],
                    from: show(key, base),
                    to: show(key, values),
                });
            }
        }
        if (values.password) {
            changes.push({
                key: 'password',
                label: 'Senha',
                from: 'atual',
                to: 'nova senha',
            });
        }
        if (photo.changed) {
            changes.push({
                key: 'photo',
                label: 'Foto',
                from: savedPhoto ? 'atual' : 'sem foto',
                to: photo.url ? 'nova foto' : 'sem foto',
            });
        }
    }

    // Erro 422 do backend volta para o campo que a tela desenha; o resto
    // (campo sem lugar na tela ou desconhecido) vai para um toast. Os outros
    // erros os hooks de criar e de salvar já mostram num toast.
    const submit = form.handleSubmit(async (v) => {
        try {
            await options.onSave(v, {
                file: photo.file,
                removed: photo.changed && !photo.url && !!savedPhoto,
            });
        } catch (error) {
            const invalid = getValidationErrors(error);
            if (!invalid) return;
            const leftover: string[] = [];
            for (const [key, messages] of Object.entries(invalid.fields)) {
                if (!messages[0]) continue;
                if ((FIELDS_WITH_ERROR as readonly string[]).includes(key)) {
                    form.setError(key as (typeof FIELDS_WITH_ERROR)[number], {
                        message: messages[0],
                    });
                } else {
                    leftover.push(messages[0]);
                }
            }
            if (leftover.length > 0) toast.error(leftover.join(' '));
            else if (Object.keys(invalid.fields).length === 0) {
                toast.error(invalid.message ?? 'Confira os dados.');
            }
        }
    });

    return {
        mode: options.mode,
        submitting: form.formState.isSubmitting,
        form,
        values,
        defaultValues: base,
        photo,
        photoError,
        setPhoto,
        changes,
        submit,
    };
}

export type UserForm = ReturnType<typeof useUserForm>;
