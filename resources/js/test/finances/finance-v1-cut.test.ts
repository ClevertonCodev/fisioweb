import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const PAGES_DIR = 'resources/js/pages/clinic/finances';

const FILES = [
    'resources/js/routes/clinic/finance-routes.tsx',
    ...readdirSync(PAGES_DIR)
        .filter((name) => /\.tsx?$/.test(name))
        .map((name) => join(PAGES_DIR, name)),
];

describe('corte v1 de Finanças', () => {
    it.each(FILES)(
        '%s não importa protótipo, PrototypeSwitcher nem a v1',
        (file) => {
            const src = readFileSync(file, 'utf8');
            expect(src).not.toMatch(/PrototypeSwitcher/);
            expect(src).not.toMatch(/finance-prototype|-prototype/);
            expect(src).not.toMatch(/usePrototypeVariant|\?variant=/);
            expect(src).not.toMatch(/components\/clinic\/finances\//);
        },
    );

    it('a pasta do protótipo e os componentes da v1 saíram', () => {
        expect(existsSync(join(PAGES_DIR, 'finance-prototype'))).toBe(false);
        expect(existsSync('resources/js/components/clinic/finances')).toBe(
            false,
        );
    });
});
