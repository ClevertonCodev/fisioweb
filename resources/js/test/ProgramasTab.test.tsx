import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as useProgramsLibraryHook from '@/application/clinic/use-clinic-programs-library';
import * as useProgramsHook from '@/application/clinic/use-programs';
import { ProgramasTab } from '@/components/clinic/program/ProgramasTab';
import { TestBrowserRouter } from '@/test/browser-router';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...(actual as object),
        useNavigate: () => mockNavigate,
    };
});

describe('ProgramasTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.spyOn(
            useProgramsLibraryHook,
            'useInfiniteClinicProgramsLibrary',
        ).mockReturnValue({
            data: {
                pages: [
                    {
                        data: [
                            {
                                id: 1,
                                title: 'Modelo Vedius 1',
                                exercisesCount: 5,
                            },
                            {
                                id: 2,
                                title: 'Modelo Vedius 2',
                                exercisesCount: 3,
                            },
                        ],
                        meta: { currentPage: 1, lastPage: 1, total: 2 },
                    },
                ],
                pageParams: [1],
            },
            isLoading: false,
            fetchNextPage: vi.fn(),
            hasNextPage: false,
            isFetchingNextPage: false,
        } as any);

        vi.spyOn(
            useProgramsLibraryHook,
            'useClinicProgramLibraryDetail',
        ).mockReturnValue({
            data: {
                id: 1,
                title: 'Modelo Vedius 1',
                exercisesCount: 5,
                durationMinutes: 10,
                createdBy: { name: 'Admin Vedius' },
                groups: [],
            },
            isLoading: false,
        } as any);

        vi.spyOn(useProgramsHook, 'useInfiniteMyPrograms').mockReturnValue({
            data: {
                pages: [
                    {
                        items: [
                            {
                                id: '10',
                                title: 'Meu Modelo 1',
                                patientId: null,
                                groups: [],
                            },
                            {
                                id: '11',
                                title: 'Meu Modelo 2',
                                patientId: null,
                                groups: [],
                            },
                        ],
                        total: 2,
                        lastPage: 1,
                        perPage: 20,
                        currentPage: 1,
                    },
                ],
                pageParams: [1],
            },
            isLoading: false,
            fetchNextPage: vi.fn(),
            hasNextPage: false,
            isFetchingNextPage: false,
        } as any);

        vi.spyOn(useProgramsHook, 'useClinicProgram').mockReturnValue({
            data: {
                id: '10',
                title: 'Meu Modelo 1',
                patientId: null,
                createdAt: '2026-03-22T10:00:00.000Z',
                groups: [
                    {
                        id: 'g1',
                        name: 'Grupo 1',
                        exercises: [
                            {
                                id: 'e1',
                                exerciseId: '100',
                                title: 'Exercício 1',
                                thumbnailUrl: 'http://example.com/thumb.jpg',
                                videoUrl: 'http://example.com/video.mp4',
                            },
                        ],
                    },
                ],
            },
            isLoading: false,
        } as any);
    });

    const renderComponent = () => {
        return render(
            <TestBrowserRouter>
                <ProgramasTab subTab="modelos" />
            </TestBrowserRouter>,
        );
    };

    it('exibe as abas Nossos modelos e Meus modelos', () => {
        renderComponent();
        expect(
            screen.getByRole('tab', { name: /nossos modelos/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('tab', { name: /meus modelos/i }),
        ).toBeInTheDocument();
    });

    it('exibe os modelos da biblioteca por padrão', () => {
        renderComponent();
        expect(screen.getAllByText('Modelo Vedius 1').length).toBeGreaterThan(
            0,
        );
        expect(screen.getAllByText('Modelo Vedius 2').length).toBeGreaterThan(
            0,
        );
        expect(screen.queryByText('Meu Modelo 1')).not.toBeInTheDocument();
    });

    it('muda para a aba Meus modelos e exibe apenas modelos sem paciente', () => {
        render(
            <TestBrowserRouter>
                <ProgramasTab subTab="meus-modelos" />
            </TestBrowserRouter>,
        );

        expect(screen.getAllByText('Meu Modelo 1').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Meu Modelo 2').length).toBeGreaterThan(0);
        expect(
            screen.queryByText('Programa de Paciente'),
        ).not.toBeInTheDocument();
    });

    it('renderiza o detalhe do meu modelo corretamente após clicar', async () => {
        render(
            <TestBrowserRouter>
                <ProgramasTab subTab="meus-modelos" />
            </TestBrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText('1 exercícios')).toBeInTheDocument();
            expect(screen.getByText('Você')).toBeInTheDocument();
        });
    });

    it('redireciona para /clinica/programas/novo com os dados preenchidos ao clicar em Criar programa', async () => {
        const user = userEvent.setup();
        renderComponent();

        const createButton = await screen.findByRole('button', {
            name: /criar programa/i,
        });
        await user.click(createButton);

        expect(mockNavigate).toHaveBeenCalledWith('/clinica/programas/novo', {
            state: expect.objectContaining({
                program: expect.objectContaining({
                    id: 1,
                    title: 'Modelo Vedius 1',
                    groups: [],
                }),
            }),
        });
    });

    it('renderiza o vídeo e miniatura do exercício em Meus modelos', async () => {
        const { container } = render(
            <TestBrowserRouter>
                <ProgramasTab subTab="meus-modelos" />
            </TestBrowserRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText('Exercício 1')).toBeInTheDocument();
        });

        const videoElement = container.querySelector('video');
        expect(videoElement).toBeInTheDocument();
        expect(videoElement).toHaveAttribute(
            'src',
            'http://example.com/video.mp4',
        );
        expect(videoElement).toHaveAttribute(
            'poster',
            'http://example.com/thumb.jpg',
        );
    });
});
