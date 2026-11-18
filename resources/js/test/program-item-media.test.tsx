import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProgramItemMedia } from '@/application/clinic/use-programs';
import type { Program, ProgramGroup } from '@/domain/clinic';

const getById = vi.fn();

vi.mock('@/infrastructure/repositories', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('@/infrastructure/repositories')>();
    return {
        ...actual,
        apiClinicProgramsRepository: {
            ...actual.apiClinicProgramsRepository,
            getById: (...args: unknown[]) => getById(...args),
        },
    };
});

function program(thumbnailUrl: string): Program {
    return {
        id: '1',
        groups: [
            {
                id: 'g1',
                name: 'Principal',
                exercises: [
                    {
                        id: '71',
                        exerciseId: '13',
                        title: 'Ponte',
                        thumbnailUrl,
                        videoUrl: 'https://conta.example/videos/ponte.mp4?s=2',
                    },
                ],
            } as unknown as ProgramGroup,
        ],
    } as unknown as Program;
}

function wrapper({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider
            client={
                new QueryClient({
                    defaultOptions: { queries: { staleTime: 60_000 } },
                })
            }
        >
            {children}
        </QueryClientProvider>
    );
}

describe('mídia de um item do programa salvo', () => {
    beforeEach(() => getById.mockReset());

    it('busca o programa de novo a cada pedido e acha o item pelo id do item', async () => {
        getById
            .mockResolvedValueOnce(program('https://conta.example/c.jpg?s=1'))
            .mockResolvedValueOnce(program('https://conta.example/c.jpg?s=2'));
        const { result } = renderHook(() => useProgramItemMedia('1'), {
            wrapper,
        });

        await result.current('71');
        const fresh = await result.current('71');

        expect(getById).toHaveBeenCalledTimes(2);
        expect(getById).toHaveBeenCalledWith('1');
        expect(fresh).toMatchObject({
            thumbnailUrl: 'https://conta.example/c.jpg?s=2',
            videoUrl: 'https://conta.example/videos/ponte.mp4?s=2',
        });
    });

    it('item que não está no programa salvo e programa ainda não salvo devolvem null', async () => {
        getById.mockResolvedValue(program('https://conta.example/c.jpg'));
        const salvo = renderHook(() => useProgramItemMedia('1'), { wrapper });
        const novo = renderHook(() => useProgramItemMedia(undefined), {
            wrapper,
        });

        expect(await salvo.result.current('13-1794-1')).toBeNull();
        expect(await novo.result.current('71')).toBeNull();
        expect(getById).toHaveBeenCalledTimes(1);
    });
});
