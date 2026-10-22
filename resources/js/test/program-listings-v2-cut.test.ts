import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const PAGES = [
    'resources/js/pages/clinic/program/ProgramListPage.tsx',
    'resources/js/pages/clinic/program/ProgramHistoryPage.tsx',
    'resources/js/pages/clinic/program/exercise-library/ExerciseLibraryPage.tsx',
    'resources/js/pages/clinic/program/program-models/ProgramModelsPage.tsx',
    'resources/js/pages/clinic/ExercisesPage.tsx',
];

describe('corte v1 das listagens de Programas', () => {
    it.each(PAGES)('%s não importa protótipo nem PrototypeSwitcher', (file) => {
        const src = readFileSync(file, 'utf8');
        expect(src).not.toMatch(/PrototypeSwitcher/);
        expect(src).not.toMatch(/-prototype/);
        expect(src).not.toMatch(/\?variant=/);
    });
});
