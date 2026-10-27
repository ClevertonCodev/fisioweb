/**
 * PROTÓTIPO (descartável): dados da clínica no DS v2. O perfil é real
 * (useClinicProfile); salvar é stub. Só o usuário mestre edita; ?mestre=0
 * simula quem não é mestre (só leitura).
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { can } from '@/application/clinic/permissions';
import {
    applyMask,
    formatCnpj,
    formatCpf,
    getCnpjValidationError,
    getCpfValidationError,
} from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicProfile } from '@/domain/clinic';

export const DATA_VARIANTS = [
    { key: 'O', name: 'Tela atual (v1)' },
    { key: 'A', name: 'Cartão de visita ao vivo' },
] as const;

export const STATUS_LABEL: Record<
    string,
    { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
    '1': { label: 'Ativa', variant: 'success' },
    '0': { label: 'Inativa', variant: 'warning' },
    '-1': { label: 'Bloqueada', variant: 'danger' },
};

export const UFS =
    'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(
        ' ',
    );

export function formatPhone(v: string) {
    const digits = v.replace(/\D/g, '');
    return applyMask(
        digits,
        digits.length > 10 ? '(##) #####-####' : '(##) ####-####',
    );
}

export interface ClinicForm {
    name: string;
    typePerson: 'PF' | 'PJ';
    document: string;
    email: string;
    phone: string;
    zipCode: string;
    address: string;
    number: string;
    city: string;
    state: string;
}

const fromProfile = (p: ClinicProfile): ClinicForm => ({
    name: p.name,
    typePerson: p.typePerson === 'PF' ? 'PF' : 'PJ',
    document:
        p.typePerson === 'PF'
            ? formatCpf(p.document ?? '')
            : formatCnpj(p.document ?? ''),
    email: p.email ?? '',
    phone: formatPhone(p.phone ?? ''),
    zipCode: applyMask((p.zipCode ?? '').replace(/\D/g, ''), '#####-###'),
    address: p.address ?? '',
    number: p.number ?? '',
    city: p.city ?? '',
    state: p.state ?? '',
});

export function useClinicData(profile: ClinicProfile) {
    const { user } = useAuth();
    const [params] = useSearchParams();
    const canEdit =
        can.editClinicData(user?.mestre) && params.get('mestre') !== '0';
    const [saved, setSaved] = useState(() => fromProfile(profile));
    const [form, setForm] = useState(saved);

    const set = <K extends keyof ClinicForm>(k: K, v: ClinicForm[K]) =>
        setForm((f) => ({ ...f, [k]: v }));

    const errors: Partial<Record<keyof ClinicForm, string>> = {};
    if (!form.name.trim()) errors.name = 'Informe o nome da clínica.';
    const docError =
        form.typePerson === 'PF'
            ? getCpfValidationError(form.document, true)
            : getCnpjValidationError(form.document, true);
    if (docError) errors.document = docError;
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'E-mail inválido.';
    if (form.zipCode && form.zipCode.replace(/\D/g, '').length !== 8)
        errors.zipCode = 'CEP incompleto.';

    /** Vazios que importam: o telefone sai no PDF do programa. */
    const missing = [
        !form.phone && 'telefone',
        !form.address && 'endereço',
        !form.city && 'cidade',
    ].filter(Boolean) as string[];

    const dirty = JSON.stringify(form) !== JSON.stringify(saved);

    return {
        profile,
        canEdit,
        form,
        set,
        setTypePerson: (t: 'PF' | 'PJ') =>
            setForm((f) => ({
                ...f,
                typePerson: t,
                document:
                    t === 'PF' ? formatCpf(f.document) : formatCnpj(f.document),
            })),
        errors,
        missing,
        dirty,
        reset: () => setForm(saved),
        save: (keys?: (keyof ClinicForm)[]) => {
            const bad = (
                keys ?? (Object.keys(errors) as (keyof ClinicForm)[])
            ).filter((k) => errors[k]);
            if (bad.length) {
                toast.error(errors[bad[0] as keyof ClinicForm]);
                return false;
            }
            setSaved(form);
            toast.success('Protótipo: os dados não foram salvos no servidor.');
            return true;
        },
        patientLink: `${window.location.host}/${profile.slug}/paciente/programas/…`,
    };
}

export type ClinicData = ReturnType<typeof useClinicData>;
