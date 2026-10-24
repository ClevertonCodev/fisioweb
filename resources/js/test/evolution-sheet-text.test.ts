import { describe, expect, it } from 'vitest';

import {
    buildEvolutionSheetText,
    evolutionDetailBlocks,
    evolutionListPreview,
    parseEvolutionSheetText,
} from '@/application/clinic/evolution-sheet-text';
import type { EvolutionTemplate } from '@/domain/clinic';

const template: EvolutionTemplate = {
    id: 1,
    clinicId: 1,
    name: 'Sessão padrão',
    description: null,
    isSystem: false,
    isActive: true,
    sections: [
        {
            id: 10,
            title: 'Conduta',
            sortOrder: 2,
            items: [
                {
                    id: 21,
                    label: 'Alongar',
                    printText: 'Alongamento de cadeia posterior',
                    hasFreeText: true,
                    freeTextPlaceholder: 'qual cadeia',
                    sortOrder: 2,
                },
                {
                    id: 20,
                    label: 'Aquecer',
                    printText: 'Aquecimento global',
                    hasFreeText: false,
                    freeTextPlaceholder: null,
                    sortOrder: 1,
                },
            ],
        },
        {
            id: 9,
            title: 'Queixa',
            sortOrder: 1,
            items: [
                {
                    id: 11,
                    label: 'Dor',
                    printText: 'Dor referida',
                    hasFreeText: false,
                    freeTextPlaceholder: null,
                    sortOrder: 1,
                },
            ],
        },
    ],
};

describe('buildEvolutionSheetText', () => {
    it('monta o texto no formato do backend, seções na ordem, complemento com traço', () => {
        const text = buildEvolutionSheetText(template, new Set([20, 21, 11]), {
            21: 'isquiotibiais',
        });

        expect(text).toBe(
            [
                '**Queixa:**',
                'Dor referida',
                '',
                '**Conduta:**',
                'Aquecimento global',
                'Alongamento de cadeia posterior — isquiotibiais',
            ].join('\n'),
        );
    });

    it('omite seção sem item marcado e ignora complemento de item desmarcado', () => {
        const text = buildEvolutionSheetText(template, new Set([20]), {
            21: 'não deve aparecer',
            20: 'também não: item sem texto livre',
        });

        expect(text).toBe(['**Conduta:**', 'Aquecimento global'].join('\n'));
        expect(text).not.toContain('Queixa');
        expect(text).not.toContain('isquiotibiais');
        expect(text).not.toContain('não deve aparecer');
    });

    it('sem template ou sem itens devolve string vazia', () => {
        expect(buildEvolutionSheetText(undefined, new Set([20]), {})).toBe('');
        expect(buildEvolutionSheetText(template, new Set(), { 21: 'x' })).toBe(
            '',
        );
    });
});

describe('parseEvolutionSheetText e previews', () => {
    const sheet = buildEvolutionSheetText(template, new Set([21]), {
        21: 'isquiotibiais',
    });

    it('parseia seções do texto gravado', () => {
        expect(parseEvolutionSheetText(sheet)).toEqual([
            {
                section: 'Conduta',
                lines: ['Alongamento de cadeia posterior — isquiotibiais'],
            },
        ]);
    });

    it('lista sem markdown na prévia', () => {
        expect(evolutionListPreview(sheet)).toBe(
            'Conduta: Alongamento de cadeia posterior — isquiotibiais',
        );
        expect(evolutionListPreview('Paciente tolerou bem. Dor 3/10.')).toBe(
            'Paciente tolerou bem. Dor 3/10.',
        );
    });

    it('drawer usa blocos do modelo ou frases no texto livre', () => {
        expect(
            evolutionDetailBlocks({ generatedText: sheet }),
        ).toEqual(parseEvolutionSheetText(sheet));
        expect(
            evolutionDetailBlocks({
                generatedText: 'Paciente tolerou bem. Dor 3/10.',
            }),
        ).toEqual([
            {
                section: 'Condutas',
                lines: ['Paciente tolerou bem.', 'Dor 3/10.'],
            },
        ]);
    });
});
