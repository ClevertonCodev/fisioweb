/**
 * O formulário de usuário da clínica, em dois modos. O cadastro é a tela de
 * verdade: usa o esquema de novo usuário (senha e função obrigatórias) e
 * grava pelo `onCreate` da página. A edição ainda é protótipo (esquema de
 * editar, senha opcional): salvar é stub e nada é gravado.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
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

/** "c*********v@gmail.com": mostra só a primeira e a última letra. */
export function maskEmail(email: string): string {
    const [local = '', domain = ''] = email.split('@');
    if (local.length <= 2) return `${local[0] ?? ''}*@${domain}`;
    return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local.at(-1)}@${domain}`;
}

/**
 * Trocar senha pede um código mandado ao e-mail de quem está logado: no
 * próprio perfil, o da pessoa; quando um administrador troca a senha de
 * outra conta, o do administrador. No protótipo, o código só aparece num
 * aviso (nenhum e-mail sai).
 */
export interface CodeStep {
    code: string;
    /** Conta os envios: muda a cada reenvio. */
    sendId: number;
    values: UserFormValues;
}

/**
 * Quem troca a senha de quem (ADR 019). null = pode trocar; senão, o motivo.
 * - A própria senha, qualquer um troca (o mestre também).
 * - A de outra pessoa, só administrador.
 * - A de outro administrador, só o mestre.
 * - A do mestre, ninguém além dele.
 */
export function passwordLockReason(
    editor: { id: string | number; role?: string; mestre?: 0 | 1 },
    target: ClinicUserSummary,
): string | null {
    if (String(editor.id) === String(target.id)) return null;
    if (target.mestre === 1) {
        return 'A senha do mestre da clínica só ele mesmo troca.';
    }
    if (editor.role !== 'admin') {
        return 'Só administrador troca a senha de outra pessoa.';
    }
    if (target.role === 'admin' && editor.mestre !== 1) {
        return 'Só o mestre da clínica troca a senha de outro administrador.';
    }
    return null;
}

function newCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

export type UserFormMode =
    | {
          mode: 'create';
          /** Grava o usuário (e a foto, se houver). Erro 422 volta aos campos. */
          onCreate: (
              values: UserFormValues,
              photo: File | null,
          ) => Promise<void>;
      }
    | {
          mode: 'edit';
          user: ClinicUserSummary;
          role: ClinicUserFormRole;
          roleLabel: (r: ClinicUserFormRole) => string;
          /** E-mail de quem está logado: recebe o código da troca de senha. */
          codeRecipient: string;
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
    // Base da comparação: depois de "salvar", o reset muda os padrões.
    const base = (form.formState.defaultValues ??
        defaultValues) as UserFormValues;

    const [savedPhoto, setSavedPhoto] = useState(user?.photoUrl ?? null);
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
    const resetPhoto = () =>
        setPhotoState({ url: savedPhoto, file: null, changed: false });

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

    const commit = (v: UserFormValues) => {
        toast.success('Protótipo: nada foi salvo', {
            description: changes.length
                ? changes.map((c) => `${c.label}: ${c.to}`).join(' · ')
                : 'Nenhuma alteração.',
        });
        form.reset({ ...v, password: '', confirmPassword: '' });
        setSavedPhoto(photo.url);
        // Mantém o arquivo: a prévia salva (stub) continua viva até trocar.
        setPhotoState((p) => ({ ...p, changed: false }));
    };

    // Erro 422 do backend volta para o campo que a tela desenha; o resto
    // (campo sem lugar na tela ou desconhecido) vai para um toast. Os outros
    // erros o hook de criar já mostra num toast.
    const create = async (v: UserFormValues) => {
        if (options.mode !== 'create') return;
        try {
            await options.onCreate(v, photo.file);
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
    };

    const [codeStep, setCodeStep] = useState<CodeStep | null>(null);
    const sendCode = (v: UserFormValues) => {
        const code = newCode();
        setCodeStep((prev) => ({
            code,
            sendId: (prev?.sendId ?? 0) + 1,
            values: v,
        }));
        toast.info(`Protótipo: nenhum e-mail saiu. O código é ${code}.`, {
            duration: 15000,
        });
    };

    // Com senha nova, salvar passa antes pelo código. Criar não pede código
    // (o código é só da troca, ADR 019).
    const submit = form.handleSubmit(async (v) => {
        if (options.mode === 'create') await create(v);
        else if (v.password) sendCode(v);
        else commit(v);
    });

    const code = {
        step: codeStep,
        recipient: options.mode === 'edit' ? options.codeRecipient : '',
        resend: () => codeStep && sendCode(codeStep.values),
        cancel: () => setCodeStep(null),
        /** true quando o código confere (e salva). */
        confirm: (typed: string) => {
            if (!codeStep || typed !== codeStep.code) return false;
            commit(codeStep.values);
            setCodeStep(null);
            return true;
        },
    };

    const discard = () => {
        form.reset(base);
        resetPhoto();
    };

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
        discard,
        code,
    };
}

export type UserForm = ReturnType<typeof useUserForm>;
