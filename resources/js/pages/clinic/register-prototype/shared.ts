/**
 * PROTÓTIPO (descartável): criar conta da clínica no DS v2. A validação é
 * a de verdade (clinicRegisterSchema); criar a conta é stub, porque o
 * auto-cadastro ainda não existe no backend (a v1 também só avisa). O
 * endereço "clinica-cleverton" aparece como já usado (é o da clínica 1).
 */
import { useState } from 'react';

import { clinicRegisterSchema } from '@/application/clinic/register-schema';
import { applyMask, formatCnpj, formatCpf } from '@/components/ds';

export const REGISTER_VARIANTS = [
    { key: 'O', name: 'Tela atual (v1)' },
    { key: 'A', name: 'Três passos' },
] as const;

export function toSlug(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

const TAKEN = ['clinica-cleverton'];

export interface RegisterValues {
    name: string;
    typePerson: 'PF' | 'PJ';
    document: string;
    email: string;
    phone: string;
    slug: string;
    password: string;
    passwordConfirmation: string;
}

export type RegisterField = keyof RegisterValues;

/** Força da senha: 0 a 4, com o que falta. */
export function passwordStrength(p: string) {
    const checks = [
        { ok: p.length >= 8, label: '8 caracteres' },
        {
            ok: /[a-z]/.test(p) && /[A-Z]/.test(p),
            label: 'maiúscula e minúscula',
        },
        { ok: /\d/.test(p), label: 'número' },
        { ok: /[^A-Za-z0-9]/.test(p), label: 'símbolo' },
    ];
    const score = checks.filter((c) => c.ok).length;
    return {
        score,
        checks,
        label:
            ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'][score] ?? '',
    };
}

export function useRegister() {
    const [v, setV] = useState<RegisterValues>({
        name: '',
        typePerson: 'PJ',
        document: '',
        email: '',
        phone: '',
        slug: '',
        password: '',
        passwordConfirmation: '',
    });
    const [slugEdited, setSlugEdited] = useState(false);
    const [touched, setTouched] = useState<
        Partial<Record<RegisterField, boolean>>
    >({});
    const [done, setDone] = useState(false);

    const parsed = clinicRegisterSchema.safeParse(v);
    const allErrors: Partial<Record<RegisterField, string>> = {};
    if (!parsed.success) {
        for (const issue of parsed.error.issues) {
            const k = issue.path[0] as RegisterField;
            allErrors[k] ??= issue.message;
        }
    }
    const slugTaken = TAKEN.includes(v.slug);
    if (slugTaken) allErrors.slug = 'Este endereço já é de outra clínica.';
    const errorOf = (k: RegisterField) =>
        touched[k] ? allErrors[k] : undefined;

    const set = (k: RegisterField, value: string) => {
        setV((cur) => {
            const next = { ...cur, [k]: value } as RegisterValues;
            if (k === 'name' && !slugEdited) next.slug = toSlug(value);
            return next;
        });
    };

    return {
        v,
        set,
        setDocument: (raw: string) =>
            set(
                'document',
                v.typePerson === 'PF' ? formatCpf(raw) : formatCnpj(raw),
            ),
        setPhone: (raw: string) => {
            const d = raw.replace(/\D/g, '');
            set(
                'phone',
                applyMask(
                    d,
                    d.length > 10 ? '(##) #####-####' : '(##) ####-####',
                ),
            );
        },
        setType: (t: 'PF' | 'PJ') =>
            setV((cur) => ({
                ...cur,
                typePerson: t,
                document:
                    t === 'PF'
                        ? formatCpf(cur.document)
                        : formatCnpj(cur.document),
            })),
        setSlug: (raw: string) => {
            setSlugEdited(true);
            set('slug', toSlug(raw));
        },
        touch: (k: RegisterField) => setTouched((t) => ({ ...t, [k]: true })),
        touchAll: (keys: RegisterField[]) =>
            setTouched((t) => ({
                ...t,
                ...Object.fromEntries(keys.map((k) => [k, true])),
            })),
        errorOf,
        allErrors,
        slugTaken,
        okFields: (keys: RegisterField[]) => keys.every((k) => !allErrors[k]),
        strength: passwordStrength(v.password),
        done,
        submit: () => {
            const keys = Object.keys(v) as RegisterField[];
            setTouched(Object.fromEntries(keys.map((k) => [k, true])));
            if (Object.keys(allErrors).length) return false;
            setDone(true);
            return true;
        },
        linkPreview: `${window.location.host}/${v.slug || 'sua-clinica'}/paciente/programas/…`,
    };
}

export type Register = ReturnType<typeof useRegister>;
