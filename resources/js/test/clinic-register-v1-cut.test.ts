import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const FILES = [
    'resources/js/routes/clinic-routes.tsx',
    'resources/js/pages/clinic/ClinicRegisterPage.tsx',
];

describe('corte v1 e protótipo de Criar Conta', () => {
    it.each(FILES)(
        '%s não importa protótipo, PrototypeSwitcher, ?variant= nem componentes v1',
        (file) => {
            const src = readFileSync(file, 'utf8');
            expect(src).not.toMatch(/PrototypeSwitcher/);
            expect(src).not.toMatch(/register-prototype/);
            expect(src).not.toMatch(/usePrototypeVariant|\?variant=/);
            expect(src).not.toMatch(/ClinicRegisterPageV1/);
        },
    );

    it('a pasta register-prototype foi removida', () => {
        expect(existsSync('resources/js/pages/clinic/register-prototype')).toBe(
            false,
        );
    });
});
