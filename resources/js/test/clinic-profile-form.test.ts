import { describe, expect, it } from 'vitest';

import {
    clinicProfileFormSchema,
    clinicProfileFormToUpdateDto,
    clinicProfileToFormValues,
} from '@/application/clinic/clinic-profile-form';
import type { ClinicProfile } from '@/domain/clinic/clinic-profile';

const validCnpj = '11.222.333/0001-81';
const validCpf = '123.456.789-09';

function validPj(overrides: Record<string, unknown> = {}) {
    return {
        name: 'Clínica Exemplo',
        typePerson: 'PJ' as const,
        document: validCnpj,
        email: 'contato@clinica.test',
        phone: '(11) 98888-7777',
        zipCode: '01310-100',
        address: 'Av. Exemplo',
        number: '100',
        city: 'São Paulo',
        state: 'SP',
        ...overrides,
    };
}

describe('clinicProfileFormSchema', () => {
    it('aceita clínica PJ com CNPJ, e-mail e CEP válidos', () => {
        expect(clinicProfileFormSchema.safeParse(validPj()).success).toBe(true);
    });

    it('rejeita CNPJ com dígito verificador errado', () => {
        const parsed = clinicProfileFormSchema.safeParse(
            validPj({ document: '11.222.333/0001-80' }),
        );

        expect(parsed.success).toBe(false);
        if (parsed.success) return;
        expect(parsed.error.flatten().fieldErrors.document).toContain(
            'CNPJ inválido',
        );
    });

    it('rejeita CNPJ incompleto', () => {
        const parsed = clinicProfileFormSchema.safeParse(
            validPj({ document: '11.222.333/0001' }),
        );

        expect(parsed.success).toBe(false);
        if (parsed.success) return;
        expect(parsed.error.flatten().fieldErrors.document).toContain(
            'CNPJ incompleto',
        );
    });

    it('rejeita CNPJ só com letras como numérico, não como obrigatório', () => {
        const parsed = clinicProfileFormSchema.safeParse(
            validPj({ document: 'AAAAAAAAAAAAAA' }),
        );

        expect(parsed.success).toBe(false);
        if (parsed.success) return;
        expect(parsed.error.flatten().fieldErrors.document).toContain(
            'CNPJ deve ser numérico',
        );
    });

    it('rejeita CPF com dígito verificador errado', () => {
        const parsed = clinicProfileFormSchema.safeParse(
            validPj({
                typePerson: 'PF',
                document: '111.111.111-11',
            }),
        );

        expect(parsed.success).toBe(false);
        if (parsed.success) return;
        expect(parsed.error.flatten().fieldErrors.document).toContain(
            'CPF inválido',
        );
    });

    it('aceita autônomo com CPF válido', () => {
        expect(
            clinicProfileFormSchema.safeParse(
                validPj({ typePerson: 'PF', document: validCpf }),
            ).success,
        ).toBe(true);
    });

    it('rejeita e-mail inválido', () => {
        const parsed = clinicProfileFormSchema.safeParse(
            validPj({ email: 'nao-e-email' }),
        );

        expect(parsed.success).toBe(false);
        if (parsed.success) return;
        expect(parsed.error.flatten().fieldErrors.email).toContain(
            'E-mail inválido',
        );
    });

    it('rejeita CEP incompleto', () => {
        const parsed = clinicProfileFormSchema.safeParse(
            validPj({ zipCode: '01310-10' }),
        );

        expect(parsed.success).toBe(false);
        if (parsed.success) return;
        expect(parsed.error.flatten().fieldErrors.zipCode).toContain(
            'CEP incompleto.',
        );
    });

    it('aceita CEP vazio', () => {
        expect(
            clinicProfileFormSchema.safeParse(validPj({ zipCode: '' })).success,
        ).toBe(true);
    });
});

describe('clinicProfileFormToUpdateDto', () => {
    it('envia documento, telefone e CEP só com dígitos e o status atual', () => {
        const values = clinicProfileFormSchema.parse(validPj());
        const dto = clinicProfileFormToUpdateDto(values, 1);

        expect(dto.document).toBe('11222333000181');
        expect(dto.phone).toBe('11988887777');
        expect(dto.zipCode).toBe('01310100');
        expect(dto.status).toBe(1);
        expect(dto.typePerson).toBe('PJ');
    });
});

describe('clinicProfileToFormValues', () => {
    it('copia os campos editáveis sem slug nem plano', () => {
        const profile: ClinicProfile = {
            id: '7',
            name: 'Clínica Exemplo',
            document: '11.222.333/0001-81',
            typePerson: 'PJ',
            status: 1,
            email: 'contato@clinica.test',
            phone: '11988887777',
            slug: 'clinica-exemplo',
            zipCode: '01310100',
            address: 'Av. Exemplo',
            number: '100',
            city: 'São Paulo',
            state: 'SP',
            planId: 3,
            planName: 'Premium',
        };

        const values = clinicProfileToFormValues(profile);

        expect(values).toEqual({
            name: 'Clínica Exemplo',
            typePerson: 'PJ',
            document: '11222333000181',
            email: 'contato@clinica.test',
            phone: '11988887777',
            zipCode: '01310100',
            address: 'Av. Exemplo',
            number: '100',
            city: 'São Paulo',
            state: 'SP',
        });
        expect(values).not.toHaveProperty('slug');
        expect(values).not.toHaveProperty('status');
        expect(values).not.toHaveProperty('planId');
    });
});
