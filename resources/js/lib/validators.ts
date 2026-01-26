/**
 * Valida CPF
 * @param cpf - CPF a ser validado (com ou sem formatação)
 * @returns true se o CPF é válido, false caso contrário
 */
export function validateCpf(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf == '') return false;

    // Elimina CPFs invalidos conhecidos
    if (
        cpf.length != 11 ||
        cpf == '00000000000' ||
        cpf == '11111111111' ||
        cpf == '22222222222' ||
        cpf == '33333333333' ||
        cpf == '44444444444' ||
        cpf == '55555555555' ||
        cpf == '66666666666' ||
        cpf == '77777777777' ||
        cpf == '88888888888' ||
        cpf == '99999999999'
    ) {
        return false;
    }

    // Valida 1o digito
    let add = 0;
    for (let i = 0; i < 9; i++) {
        add += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) {
        rev = 0;
    }

    if (rev != parseInt(cpf.charAt(9))) {
        return false;
    }

    // Valida 2o digito
    add = 0;
    for (let i = 0; i < 10; i++) {
        add += parseInt(cpf.charAt(i)) * (11 - i);
    }

    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) {
        rev = 0;
    }

    if (rev != parseInt(cpf.charAt(10))) {
        return false;
    }

    return true;
}

/**
 * Valida CNPJ
 * @param cnpj - CNPJ a ser validado (com ou sem formatação)
 * @returns true se o CNPJ é válido, false caso contrário
 */
export function validateCnpj(cnpj: string): boolean {
    // Remover caracteres não numéricos
    let cnpjClean = cnpj.replace(/[^\d]+/g, '');

    // Verificar se tem 14 dígitos
    if (cnpjClean.length != 14) {
        return false;
    }

    // Eliminar CNPJs conhecidos como inválidos, 11111111111111, 22222222222222, etc
    if (cnpjClean.match(/(\d)\1{13}/)) {
        return false;
    }

    // Calcular o primeiro dígito verificador
    let soma = 0;
    for (let i = 0, j = 5; i < 12; i++) {
        soma += parseInt(cnpjClean[i]) * j;
        j = j == 2 ? 9 : j - 1;
    }
    let resto = soma % 11;
    let dv1 = resto < 2 ? 0 : 11 - resto;

    // Calcular o segundo dígito verificador
    soma = 0;
    for (let i = 0, j = 6; i < 13; i++) {
        soma += parseInt(cnpjClean[i]) * j;
        j = j == 2 ? 9 : j - 1;
    }
    resto = soma % 11;
    let dv2 = resto < 2 ? 0 : 11 - resto;

    // Verificar se os dígitos verificadores estão corretos
    return cnpjClean[12] == String(dv1) && cnpjClean[13] == String(dv2);
}

/**
 * Gera um slug a partir de uma string
 * @param text - Texto a ser convertido em slug
 * @returns Slug gerado
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres não alfanuméricos por hífen
        .replace(/^-+|-+$/g, ''); // Remove hífens do início e fim
}
