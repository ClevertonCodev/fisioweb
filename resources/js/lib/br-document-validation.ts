/** Alinhado a `ValidationHelper::validateCpf` / `validateCnpj` / identificação CREFITO (PHP). */

export function isValidCpf(raw: string): boolean {
    const cpf = raw.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let add = 0;
    for (let i = 0; i < 9; i++) {
        add += Number(cpf[i]) * (10 - i);
    }
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== Number(cpf[9])) return false;

    add = 0;
    for (let i = 0; i < 10; i++) {
        add += Number(cpf[i]) * (11 - i);
    }
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    return rev === Number(cpf[10]);
}

export function isValidCnpj(raw: string): boolean {
    const cnpj = raw.replace(/\D/g, '');
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

    let soma = 0;
    let j = 5;
    for (let i = 0; i < 12; i++) {
        soma += Number(cnpj[i]) * j;
        j = j === 2 ? 9 : j - 1;
    }
    let resto = soma % 11;
    const dv1 = resto < 2 ? 0 : 11 - resto;

    soma = 0;
    j = 6;
    for (let i = 0; i < 13; i++) {
        soma += Number(cnpj[i]) * j;
        j = j === 2 ? 9 : j - 1;
    }
    resto = soma % 11;
    const dv2 = resto < 2 ? 0 : 11 - resto;

    return Number(cnpj[12]) === dv1 && Number(cnpj[13]) === dv2;
}

/** Registro profissional (CREFITO): UF (2 letras) + número, separadores opcionais. */
export function isValidCrefitoRegistration(raw: string): boolean {
    const s = raw.trim();
    if (s.length < 6 || s.length > 30) return false;
    if (!/[A-Za-zÀ-ÿ]/u.test(s)) return false;
    const compact = s.replace(/\s+/g, '');
    return /^[A-Za-zÀ-ÿ]{2}[.\-/]?\d{4,}(?:[.\-/][A-Za-z0-9]+)*$/u.test(compact);
}

export type ClinicUserDocumentKind = 'cpf' | 'cnpj' | 'crefito';

/** Melhor esforço para pré-selecionar o tipo na edição. */
export function inferClinicUserDocumentKind(raw: string | undefined | null): ClinicUserDocumentKind {
    const d = (raw ?? '').trim();
    if (!d) return 'cpf';
    if (/[A-Za-zÀ-ÿ]/u.test(d)) return 'crefito';
    const digits = d.replace(/\D/g, '');
    if (digits.length <= 11) return 'cpf';
    return 'cnpj';
}

export function documentStoredValueForForm(
    kind: ClinicUserDocumentKind,
    stored: string | undefined | null,
): string {
    const d = stored ?? '';
    if (kind === 'cpf' || kind === 'cnpj') return d.replace(/\D/g, '');
    return d.replace(/\s+/g, ' ').trim();
}

export function serializeClinicUserDocument(
    kind: ClinicUserDocumentKind,
    raw: string,
): string {
    const t = raw.trim();
    if (kind === 'cpf' || kind === 'cnpj') return t.replace(/\D/g, '');
    return t.replace(/\s+/g, ' ').trim();
}
