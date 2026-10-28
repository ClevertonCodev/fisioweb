import { describe, expect, it } from 'vitest';

import {
    programMailtoUrl,
    programWhatsAppUrl,
} from '@/application/clinic/program-share';
import type { Program } from '@/domain/clinic';

function program(overrides: Partial<Program> = {}): Program {
    return {
        id: '6',
        title: 'Prevenção de Quedas',
        patientId: '48',
        patientName: 'Ana',
        patientPhotoUrl: null,
        patientPhone: '(11) 98765-4321',
        patientEmail: 'ana@exemplo.test',
        shareUrl: 'https://exemplo.test/p/6',
        professionalId: '1',
        professionalName: 'Fisio',
        professionalPhotoUrl: null,
        exerciseCount: 0,
        startDate: null,
        endDate: null,
        message: '  Em caso de dor, pare.  ',
        groups: [],
        status: 'active',
        patientViewedAt: null,
        patientCompletedCount: 0,
        createdAt: '2026-10-01T00:00:00Z',
        ...overrides,
    };
}

function textOf(url: string, param: string): string {
    return new URL(url).searchParams.get(param) ?? '';
}

describe('programWhatsAppUrl', () => {
    it('abre o wa.me do telefone só com dígitos e a mensagem com o link', () => {
        const url = programWhatsAppUrl(program())!;

        expect(url.startsWith('https://wa.me/11987654321?text=')).toBe(true);
        expect(textOf(url, 'text')).toBe(
            [
                'Olá, Ana!',
                'Seu programa de tratamento "Prevenção de Quedas" já está disponível.',
                'Em caso de dor, pare.',
                'Acesse: https://exemplo.test/p/6',
            ].join('\n\n'),
        );
    });

    it('pula a mensagem do fisioterapeuta quando está vazia', () => {
        const url = programWhatsAppUrl(program({ message: '   ' }))!;

        expect(textOf(url, 'text')).not.toContain('\n\n\n\n');
        expect(textOf(url, 'text').split('\n\n')).toHaveLength(3);
    });

    it('devolve null sem telefone', () => {
        expect(programWhatsAppUrl(program({ patientPhone: null }))).toBeNull();
        expect(programWhatsAppUrl(program({ patientPhone: '  ' }))).toBeNull();
    });
});

describe('programMailtoUrl', () => {
    it('usa o mesmo texto do WhatsApp no corpo do e-mail', () => {
        const mail = programMailtoUrl(program())!;
        const body = decodeURIComponent(mail.split('&body=')[1]!);

        expect(mail.startsWith('mailto:ana%40exemplo.test?subject=')).toBe(
            true,
        );
        expect(body).toBe(textOf(programWhatsAppUrl(program())!, 'text'));
    });

    it('devolve null sem e-mail', () => {
        expect(programMailtoUrl(program({ patientEmail: null }))).toBeNull();
    });
});
