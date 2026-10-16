// Máscaras e validações de documento do DS. No Vue as máscaras vinham da
// biblioteca maska; aqui são funções puras com a mesma semântica:
// "#" é dígito, "*" é letra ou dígito, qualquer outro caractere é literal e só
// entra quando ainda há caractere para depois dele.

type MaskToken = { pattern: RegExp; transform?: (char: string) => string };

const DEFAULT_TOKENS: Record<string, MaskToken> = {
    '#': { pattern: /\d/ },
    '*': { pattern: /[A-Za-z0-9]/, transform: (c) => c.toUpperCase() },
};

export function applyMask(
    raw: string,
    mask: string,
    tokens: Record<string, MaskToken> = DEFAULT_TOKENS,
): string {
    let output = '';
    let r = 0;

    for (let m = 0; m < mask.length && r < raw.length; m++) {
        const token = tokens[mask[m]];

        if (!token) {
            output += mask[m];
            if (raw[r] === mask[m]) r++;
            continue;
        }

        // Pula o que não serve no token até achar um caractere que sirva.
        while (r < raw.length && !token.pattern.test(raw[r])) r++;
        if (r >= raw.length) break;

        output += token.transform ? token.transform(raw[r]) : raw[r];
        r++;
    }

    // Literal pendurado no fim (sem caractere depois) sai. A saída anda junto
    // com a máscara, então a posição na saída é a mesma na máscara.
    while (output && !tokens[mask[output.length - 1]]) {
        output = output.slice(0, -1);
    }

    return output;
}

function isSignificant(char: string) {
    return /[A-Za-z0-9]/.test(char);
}

/**
 * Posição do cursor depois de reformatar: fica depois do mesmo número de
 * caracteres significativos (letras e dígitos) que havia antes dele.
 */
export function maskedCaret(
    raw: string,
    caret: number,
    formatted: string,
): number {
    const before = raw.slice(0, caret);
    const significant = before.split('').filter(isSignificant).length;
    const endsWithLiteral =
        before.length > 0 && !isSignificant(before[before.length - 1]);

    let seen = 0;
    let position = 0;
    while (position < formatted.length && seen < significant) {
        if (isSignificant(formatted[position])) seen++;
        position++;
    }
    if (endsWithLiteral) {
        while (
            position < formatted.length &&
            !isSignificant(formatted[position])
        )
            position++;
    }
    return position;
}

export const CPF_MASK = '###.###.###-##';
export const CNPJ_MASK = '**.***.***/****-##';
export const RG_MAX_LENGTH = 20;
export const CNH_MASK = '###########';
export const PASSPORT_MASK = '*********';

export function formatCpf(value: string): string {
    return applyMask(value.replace(/\D/g, '').slice(0, 11), CPF_MASK);
}

export function formatCnpj(value: string): string {
    return applyMask(
        value
            .replace(/[^A-Za-z0-9]/g, '')
            .toUpperCase()
            .slice(0, 14),
        CNPJ_MASK,
    );
}

// RG antigo tem letra (dígito "X", prefixo de estado como "MG-"), então o RG
// aceita letras, dígitos e separadores em vez de uma máscara numérica fixa.
export function normalizeRg(value: string): string {
    return value
        .replace(/[^A-Za-z0-9./ -]/g, '')
        .toUpperCase()
        .slice(0, RG_MAX_LENGTH);
}

export function formatRg(value: string): string {
    return normalizeRg(value);
}

export function formatCnh(value: string): string {
    return value.replace(/\D/g, '').slice(0, 11);
}

export function formatPassport(value: string): string {
    return value
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
        .slice(0, 9);
}

export function normalizeDocumentDigits(value: string): string {
    return value.replace(/\D/g, '');
}

export function normalizeCnpj(value: string): string {
    return value.toUpperCase().replace(/[./\-\s]/g, '');
}

export function isValidCpf(value: string): boolean {
    const digits = normalizeDocumentDigits(value);
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

    for (let t = 9; t <= 10; t++) {
        let sum = 0;
        for (let c = 0; c < t; c++) sum += +digits[c] * (t + 1 - c);
        const check = ((sum * 10) % 11) % 10;
        if (check !== +digits[t]) return false;
    }

    return true;
}

export function isValidCnpj(value: string): boolean {
    const cnpj = normalizeCnpj(value);

    if (cnpj.length !== 14) return false;
    if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj)) return false;
    if (/^(.)\1{13}$/.test(cnpj)) return false;

    const calcDv = (body: string, length: number): number => {
        let sum = 0;
        for (let i = 0; i < length; i++) {
            sum += (body.charCodeAt(i) - 48) * (((length - 1 - i) % 8) + 2);
        }
        const rest = sum % 11;
        return rest < 2 ? 0 : 11 - rest;
    };

    return (
        calcDv(cnpj, 12) === Number(cnpj[12]) &&
        calcDv(cnpj, 13) === Number(cnpj[13])
    );
}

export function getCpfValidationError(value: string, required = false): string {
    if (!value) return required ? 'CPF é obrigatório' : '';
    if (normalizeDocumentDigits(value).length !== 11) return 'CPF incompleto';
    if (!isValidCpf(value)) return 'CPF inválido';
    return '';
}

export function getCnpjValidationError(
    value: string,
    required = false,
): string {
    if (!value) return required ? 'CNPJ é obrigatório' : '';
    if (normalizeCnpj(value).length !== 14) return 'CNPJ incompleto';
    if (!isValidCnpj(value)) return 'CNPJ inválido';
    return '';
}

export function getRgValidationError(value: string, required = false): string {
    if (!value.trim()) return required ? 'RG é obrigatório' : '';

    const body = value.replace(/[./\-\s]/g, '');
    if (body && !/^[A-Za-z0-9]+$/.test(body))
        return 'RG deve conter apenas letras e números';

    return '';
}

export function getCnhValidationError(value: string, required = false): string {
    if (!value.trim()) return required ? 'CNH é obrigatória' : '';
    if (normalizeDocumentDigits(value).length < 11) return 'CNH incompleta';
    return '';
}

export function getPassportValidationError(
    value: string,
    required = false,
): string {
    if (!value.trim()) return required ? 'Passaporte é obrigatório' : '';
    if (formatPassport(value).length < 6) return 'Passaporte incompleto';
    return '';
}
