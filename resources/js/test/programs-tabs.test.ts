import { describe, expect, it } from 'vitest';

import {
    programsTabFromPath,
    programsTabPath,
} from '@/pages/clinic/program/programs-shell/programs-tabs';

describe('programs-tabs', () => {
    it('deriva a aba pelo caminho e lembra Meus modelos ao voltar', () => {
        expect(programsTabFromPath('/clinica/programas/historico')).toBe(
            'historico',
        );
        expect(programsTabFromPath('/clinica/programas/exercicios')).toBe(
            'exercicios',
        );
        expect(programsTabFromPath('/clinica/programas/meus-modelos')).toBe(
            'programas',
        );
        expect(
            programsTabPath(
                'programas',
                '/clinica/programas/meus-modelos',
            ),
        ).toBe('/clinica/programas/meus-modelos');
        expect(
            programsTabPath('programas', '/clinica/programas/historico'),
        ).toBe('/clinica/programas/modelos');
    });
});
