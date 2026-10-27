import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const FILES = [
    'resources/js/pages/clinic/program/ProgramDetailPage.tsx',
    'resources/js/pages/clinic/program/program-detail/ProgramDetailPanel.tsx',
    'resources/js/routes/clinic/program-routes.tsx',
];

describe('corte v1 do detalhe do programa', () => {
    it.each(FILES)('%s não importa protótipo nem PrototypeSwitcher', (file) => {
        const src = readFileSync(file, 'utf8');
        expect(src).not.toMatch(/PrototypeSwitcher/);
        expect(src).not.toMatch(/-prototype/);
        expect(src).not.toMatch(/usePrototypeVariant|\?variant=/);
    });

    it('a pasta do protótipo do detalhe saiu', () => {
        expect(
            existsSync(
                'resources/js/pages/clinic/program/program-detail-prototype',
            ),
        ).toBe(false);
    });
});
