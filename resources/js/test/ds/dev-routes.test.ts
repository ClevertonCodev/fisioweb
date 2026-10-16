import { afterEach, describe, expect, it, vi } from 'vitest';

describe('rotas de dev do design system', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('registra /design-system quando DEV é verdadeiro', async () => {
        vi.stubEnv('DEV', true);
        vi.resetModules();

        const { devRoutes } = await import('@/routes/dev-routes');

        expect(devRoutes.map((route) => route.path)).toEqual([
            '/design-system',
        ]);
    });

    it('não registra nenhuma rota fora do DEV', async () => {
        vi.stubEnv('DEV', false);
        vi.resetModules();

        const { devRoutes } = await import('@/routes/dev-routes');

        expect(devRoutes).toEqual([]);
    });
});
