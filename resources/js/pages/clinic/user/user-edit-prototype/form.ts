/**
 * PROTÓTIPO (descartável): o formulário de edição de usuário, igual para as
 * três variantes. Usa o esquema real (clinicUserEditFormSchema); salvar é
 * stub: mostra o que seria enviado e marca o formulário como salvo.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
    clinicUserEditFormSchema,
    type ClinicUserEditFormValues,
    type ClinicUserFormRole,
    type ClinicUserFormStatus,
} from '@/application/clinic/clinic-user-form';
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

export const FIELD_LABEL: Record<keyof ClinicUserEditFormValues, string> = {
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
    changed: boolean;
}

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
    values: ClinicUserEditFormValues;
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

export function useUserEditForm(
    user: ClinicUserSummary,
    role: ClinicUserFormRole,
    roleLabel: (r: ClinicUserFormRole) => string,
    /** E-mail de quem está logado: recebe o código da troca de senha. */
    codeRecipient: string,
) {
    const defaultValues = useMemo<ClinicUserEditFormValues>(() => {
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

    const form = useForm<ClinicUserEditFormValues>({
        resolver: zodResolver(clinicUserEditFormSchema),
        defaultValues,
        mode: 'onTouched',
    });
    const values = useWatch({
        control: form.control,
    }) as ClinicUserEditFormValues;
    // Base da comparação: depois de "salvar", o reset muda os padrões.
    const base = (form.formState.defaultValues ??
        defaultValues) as ClinicUserEditFormValues;

    const [savedPhoto, setSavedPhoto] = useState(user.photoUrl ?? null);
    const [photo, setPhotoState] = useState<PhotoState>({
        url: user.photoUrl ?? null,
        changed: false,
    });
    const setPhoto = (file: File | null) => {
        setPhotoState({
            url: file ? URL.createObjectURL(file) : null,
            changed: true,
        });
    };
    const resetPhoto = () => setPhotoState({ url: savedPhoto, changed: false });

    const show = (
        key: keyof ClinicUserEditFormValues,
        v: ClinicUserEditFormValues,
    ) => {
        if (key === 'role') return roleLabel(v.role);
        if (key === 'status') return v.status === '1' ? 'Ativo' : 'Inativo';
        if (key === 'documentKind') return DOCUMENT_KIND_LABEL[v.documentKind];
        if (key === 'password') return v.password ? '••••••••' : '—';
        return String(v[key] ?? '') || '—';
    };

    const changes: Change[] = [];
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

    const commit = (v: ClinicUserEditFormValues) => {
        toast.success('Protótipo: nada foi salvo', {
            description: changes.length
                ? changes.map((c) => `${c.label}: ${c.to}`).join(' · ')
                : 'Nenhuma alteração.',
        });
        form.reset({ ...v, password: '', confirmPassword: '' });
        setSavedPhoto(photo.url);
        setPhotoState((p) => ({ ...p, changed: false }));
    };

    const [codeStep, setCodeStep] = useState<CodeStep | null>(null);
    const sendCode = (v: ClinicUserEditFormValues) => {
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

    // Com senha nova, salvar passa antes pelo código.
    const submit = form.handleSubmit((v) =>
        v.password ? sendCode(v) : commit(v),
    );

    const code = {
        step: codeStep,
        recipient: codeRecipient,
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
        form,
        values,
        defaultValues: base,
        photo,
        setPhoto,
        changes,
        submit,
        discard,
        code,
    };
}

export type UserEditForm = ReturnType<typeof useUserEditForm>;
