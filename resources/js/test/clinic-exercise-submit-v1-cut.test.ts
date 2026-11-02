import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const FILES = [
    'resources/js/routes/clinic-routes.tsx',
    'resources/js/pages/clinic/ClinicSubmitExercisePage.tsx',
];

describe('corte v1 e protótipo de Enviar Exercício', () => {
    it.each(FILES)(
        '%s não importa protótipo, PrototypeSwitcher, ?variant= nem componentes v1',
        (file) => {
            const src = readFileSync(file, 'utf8');
            expect(src).not.toMatch(/PrototypeSwitcher/);
            expect(src).not.toMatch(/exercise-submit-prototype/);
            expect(src).not.toMatch(/usePrototypeVariant|\?variant=/);
            expect(src).not.toMatch(/ClinicSubmitExerciseV1/);
            expect(src).not.toMatch(/@\/components\/ui\//);
        },
    );

    it('a pasta exercise-submit-prototype foi removida', () => {
        expect(
            existsSync('resources/js/pages/clinic/exercise-submit-prototype'),
        ).toBe(false);
    });
});
