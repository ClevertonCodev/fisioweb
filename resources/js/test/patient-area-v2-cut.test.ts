import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const FILES = [
    'resources/js/pages/patient/auth/PatientLoginPage.tsx',
    'resources/js/pages/patient/program/PatientProgramListPage.tsx',
    'resources/js/pages/patient/program/PatientExerciseDetailPage.tsx',
    'resources/js/pages/patient/program/PatientProgramDetailPage.tsx',
    'resources/js/pages/patient/program/PatientProgramExecutionPage.tsx',
    'resources/js/pages/patient/program/PatientProgramFeedbackPage.tsx',
    'resources/js/pages/patient/program/PatientProgramSuccessPage.tsx',
    'resources/js/routes/patient/auth-routes.tsx',
    'resources/js/routes/patient/program-routes.tsx',
];

const PATIENT_PAGES = 'resources/js/pages/patient';

const PAGES_WITHOUT_VARIANT = [
    'resources/js/pages/patient/program/PatientProgramListPage.tsx',
    'resources/js/pages/patient/program/PatientExerciseDetailPage.tsx',
    'resources/js/pages/patient/program/PatientProgramSuccessPage.tsx',
];

function prototypeDirs(dir: string): string[] {
    if (!existsSync(dir)) return [];

    const found: string[] = [];

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (!entry.isDirectory()) continue;
        if (entry.name.endsWith('-prototype')) found.push(full);
        found.push(...prototypeDirs(full));
    }

    return found;
}

describe('corte v2 da área do paciente', () => {
    it.each(FILES)(
        '%s não importa protótipo, barra de variantes nem a v1',
        (file) => {
            const src = readFileSync(file, 'utf8');
            expect(src).not.toMatch(/PrototypeSwitcher/);
            expect(src).not.toMatch(/-prototype/);
            expect(src).not.toMatch(/\?variant=/);
            expect(src).not.toMatch(
                /PatientProgramListPageV1|PatientExerciseDetailPageV1/,
            );
            expect(src).not.toMatch(/Opção [ABC]/);
            expect(src).not.toMatch(/Protótipo em Validação/);
        },
    );

    it('a v1 do exercício saiu', () => {
        expect(
            existsSync(
                'resources/js/pages/patient/program/PatientExerciseDetailPageV1.tsx',
            ),
        ).toBe(false);
        expect(
            existsSync(
                'resources/js/pages/patient/program/PatientExerciseDetailPageV2B.tsx',
            ),
        ).toBe(false);
    });

    it('a navbar v1 saiu', () => {
        expect(existsSync('resources/js/components/PatientNavbar.tsx')).toBe(
            false,
        );
        expect(existsSync('resources/js/test/patient-navbar.test.tsx')).toBe(
            false,
        );
    });

    it('pastas de protótipo patient saíram', () => {
        expect(
            existsSync(
                'resources/js/pages/patient/program/program-success-prototype',
            ),
        ).toBe(false);
        expect(prototypeDirs(PATIENT_PAGES)).toEqual([]);
    });

    it.each(PAGES_WITHOUT_VARIANT)('%s não lê o parâmetro variant', (file) => {
        const src = readFileSync(file, 'utf8');
        expect(src).not.toMatch(/useSearchParams/);
        expect(src).not.toMatch(/get\(['"]variant['"]\)/);
    });

    it('a lista v1 saiu', () => {
        expect(
            existsSync(
                'resources/js/pages/patient/program/PatientProgramListPageV1.tsx',
            ),
        ).toBe(false);
        expect(
            existsSync(
                'resources/js/pages/patient/program/program-list-prototype',
            ),
        ).toBe(false);
    });
});
