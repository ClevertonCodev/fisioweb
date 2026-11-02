import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

const PAGES = [
    'resources/js/pages/clinic/evolution-template/EvolutionTemplateListPage.tsx',
    'resources/js/pages/clinic/evolution-template/EvolutionTemplateNewPage.tsx',
    'resources/js/pages/clinic/evolution-template/EvolutionTemplateEditPage.tsx',
    'resources/js/pages/clinic/evolution-template/TryTemplate.tsx',
    'resources/js/pages/clinic/evolution-template/evolution-template-editor/EvolutionTemplateEditorScreen.tsx',
    'resources/js/pages/clinic/evolution-template/evolution-template-editor/schema.ts',
    'resources/js/routes/clinic/evolution-template-routes.tsx',
] as const;

const REMOVED_PATHS = [
    'resources/js/pages/clinic/evolution-template/evolution-template-prototype',
    'resources/js/components/clinic/evolution-template/TemplateSectionBuilder.tsx',
    'resources/js/components/clinic/evolution-template/TemplatePreview.tsx',
    'resources/js/components/clinic/evolution-template/types.ts',
    'resources/js/pages/clinic/PrototypeSwitcher.tsx',
] as const;

describe('Corte da v1 e do protótipo dos modelos de evolução (ADR 020)', () => {
    it.each(PAGES)(
        '%s não importa protótipo, PrototypeSwitcher, ?variant=, apiClient nem componentes shadcn v1',
        (file) => {
            const src = readFileSync(join(ROOT, file), 'utf8');
            expect(src).not.toMatch(/evolution-template-prototype/);
            expect(src).not.toMatch(/PrototypeSwitcher/);
            expect(src).not.toMatch(/usePrototypeVariant|\?variant=/);
            expect(src).not.toMatch(/DEMO_TEMPLATES/);
            expect(src).not.toMatch(/apiClient/);
            expect(src).not.toMatch(/@\/components\/ui\//);
        },
    );

    it.each(REMOVED_PATHS)('%s foi removido do repositório', (removedPath) => {
        expect(existsSync(join(ROOT, removedPath))).toBe(false);
    });
});
