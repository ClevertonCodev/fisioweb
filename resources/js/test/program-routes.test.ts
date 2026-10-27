import { QueryClient } from '@tanstack/react-query';
import type { LoaderFunctionArgs, RouteObject } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findClinicProgram } from '@/application/clinic/use-programs';
import { programClinicRoutes } from '@/routes/clinic/program-routes';

vi.mock('@/application/clinic/use-programs', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    findClinicProgram: vi.fn(),
}));

const mockFind = vi.mocked(findClinicProgram);

function loaderOf(path: string) {
    const route = programClinicRoutes(new QueryClient()).find(
        (r: RouteObject) => r.path === path,
    );
    const loader = route?.loader;
    if (typeof loader !== 'function') throw new Error(`sem loader: ${path}`);
    return (id: string) =>
        loader({
            params: { id },
            request: new Request(`http://localhost${path}`),
            context: undefined,
        } as LoaderFunctionArgs);
}

describe('rotas de programa da clínica', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFind.mockResolvedValue(null);
    });

    it('detalhe não estoura quando o programa não existe (a tela mostra "não encontrado")', async () => {
        await expect(
            loaderOf('/clinica/programas/:id')('99'),
        ).resolves.toBeDefined();
    });

    it('edição lança 404 quando o programa não existe, para cair na tela de erro', async () => {
        await expect(
            loaderOf('/clinica/programas/:id/editar')('99'),
        ).rejects.toMatchObject({ status: 404 });
    });
});
