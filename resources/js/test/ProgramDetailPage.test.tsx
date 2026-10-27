import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Program, ProgramExercise } from '@/domain/clinic';
import ProgramDetailPage from '@/pages/clinic/program/ProgramDetailPage';
import { routerFutureFlags } from '@/test/browser-router';

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const downloadPdf = vi.fn();
vi.mock('@/application/clinic/download-program-pdf', () => ({
    downloadProgramPdf: (...args: unknown[]) => downloadPdf(...args),
}));

let authRole = 'admin';

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, name: 'Cleverton', type: 'clinic', role: authRole },
        token: 'fake',
        login: vi.fn(),
        logout: vi.fn(),
        guard: 'clinic',
    }),
}));

const getById = vi.fn();
const duplicateProgram = vi.fn();
const destroyProgram = vi.fn();
const toModelProgram = vi.fn();

vi.mock('@/infrastructure/repositories', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('@/infrastructure/repositories')>();
    return {
        ...actual,
        apiClinicProgramsRepository: {
            getById: (...args: unknown[]) => getById(...args),
            duplicate: (...args: unknown[]) => duplicateProgram(...args),
            toModel: (...args: unknown[]) => toModelProgram(...args),
            destroy: (...args: unknown[]) => destroyProgram(...args),
            fetchPdfBlob: vi.fn(),
        },
    };
});

function exercise(overrides: Partial<ProgramExercise> = {}): ProgramExercise {
    return {
        id: 'e1',
        exerciseId: '100',
        title: 'Ponte Glútea',
        thumbnailUrl: 'https://cdn.test/ponte.jpg',
        videoUrl: 'https://cdn.test/ponte.mp4',
        days: [1, 3, 5],
        period: 'manha',
        seriesMin: 3,
        seriesMax: 3,
        repetitionsMin: 10,
        repetitionsMax: 15,
        loadMin: null,
        loadMax: null,
        restTime: null,
        notes: 'Subir devagar',
        isConfigured: true,
        ...overrides,
    };
}

function program(overrides: Partial<Program> = {}): Program {
    return {
        id: '6',
        title: 'Prevenção de Quedas — Equilíbrio e Marcha',
        patientId: '48',
        patientName: 'Paciente Teste',
        patientPhotoUrl: null,
        patientPhone: null,
        patientEmail: null,
        shareUrl: 'https://exemplo.test/p/6',
        professionalId: '1',
        professionalName: 'Cleverton',
        professionalPhotoUrl: null,
        exerciseCount: 2,
        startDate: '2026-09-13',
        endDate: null,
        message: 'Em caso de dor, interrompa.',
        groups: [
            {
                id: 'g1',
                name: 'Principal',
                exercises: [
                    exercise(),
                    exercise({
                        id: 'e2',
                        title: 'Bird Dog',
                        videoUrl: '',
                        days: [0, 1, 2, 3, 4, 5, 6],
                        period: null,
                        notes: null,
                    }),
                ],
            },
        ],
        status: 'completed',
        patientViewedAt: '2026-09-28T13:00:00',
        patientCompletedCount: 3,
        createdAt: '2026-09-13T00:00:00Z',
        ...overrides,
    };
}

function UrlProbe({ label }: { label: string }) {
    const location = useLocation();
    return (
        <p>
            {label} {location.pathname}
            {location.search}
        </p>
    );
}

function renderPage(url = '/clinica/programas/6', state?: unknown) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={[{ pathname: url, state }]}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/programas/:id"
                        element={<ProgramDetailPage />}
                    />
                    <Route
                        path="/clinica/programas/:id/editar"
                        element={<div>edição do programa</div>}
                    />
                    <Route
                        path="/clinica/pacientes/:id"
                        element={<UrlProbe label="prontuário" />}
                    />
                    <Route
                        path="/clinica/programas/historico"
                        element={<UrlProbe label="histórico" />}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('ProgramDetailPage (painel v2)', () => {
    beforeAll(() => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
        global.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    });

    beforeEach(() => {
        vi.clearAllMocks();
        authRole = 'admin';
        getById.mockResolvedValue(program());
    });

    it('programa enviado mostra o topo, os quatro números e os exercícios com dose e agenda', async () => {
        renderPage();

        expect(
            await screen.findByRole('heading', {
                level: 1,
                name: 'Prevenção de Quedas — Equilíbrio e Marcha',
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Paciente Teste · com Cleverton'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Em caso de dor, interrompa\./),
        ).toBeInTheDocument();

        expect(screen.getByText('Vezes que completou')).toBeInTheDocument();
        expect(screen.getByText('Sem fim')).toBeInTheDocument();
        expect(screen.getByText('Paciente abriu')).toBeInTheDocument();

        const grupo = screen.getByRole('region', { name: /Principal/ });
        const [ponte, birdDog] = within(grupo).getAllByRole('listitem');
        expect(ponte).toHaveTextContent('1.Ponte Glútea');
        expect(ponte).toHaveTextContent('3 séries');
        expect(ponte).toHaveTextContent('10–15 repetições');
        expect(ponte).toHaveTextContent('Seg, Qua, Sex · Manhã');
        expect(ponte).toHaveTextContent('Subir devagar');
        expect(birdDog).toHaveTextContent('2.Bird Dog');
        expect(birdDog).toHaveTextContent('Todos os dias');
        expect(getById).toHaveBeenCalledWith('6');
    });

    it('rascunho troca três números pelo aviso e "Continuar editando" leva à edição', async () => {
        getById.mockResolvedValue(
            program({ status: 'draft', patientViewedAt: null }),
        );
        const user = userEvent.setup();
        renderPage();

        expect(
            await screen.findByText('Rascunho: o paciente ainda não recebeu'),
        ).toBeInTheDocument();
        expect(screen.getByText('Exercícios')).toBeInTheDocument();
        expect(
            screen.queryByText('Vezes que completou'),
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Paciente abriu')).not.toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: 'Continuar editando' }),
        );

        expect(
            await screen.findByText('edição do programa'),
        ).toBeInTheDocument();
    });

    it('programa de outra clínica (API devolve null) mostra "Programa não encontrado" sem nada dele', async () => {
        getById.mockResolvedValue(null);
        renderPage('/clinica/programas/999');

        expect(
            await screen.findByText('Programa não encontrado'),
        ).toBeInTheDocument();
        expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
        expect(
            screen.queryByRole('button', { name: 'Editar' }),
        ).not.toBeInTheDocument();
        expect(getById).toHaveBeenCalledWith('999');
    });

    it('tocar na miniatura abre o vídeo no modal', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await screen.findByRole('button', {
                name: 'Ver vídeo de Ponte Glútea',
            }),
        );

        const modal = await screen.findByRole('dialog', {
            name: 'Ponte Glútea',
        });
        expect(modal.querySelector('video')).toHaveAttribute(
            'src',
            'https://cdn.test/ponte.mp4',
        );
    });

    it('exercício sem vídeo mostra o aviso no modal', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await screen.findByRole('button', {
                name: 'Ver vídeo de Bird Dog',
            }),
        );

        const modal = await screen.findByRole('dialog', { name: 'Bird Dog' });
        expect(
            within(modal).getByText('Este exercício não tem vídeo.'),
        ).toBeInTheDocument();
        expect(modal.querySelector('video')).toBeNull();
    });

    it('"Editar" leva à edição do programa', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(await screen.findByRole('button', { name: 'Editar' }));

        expect(
            await screen.findByText('edição do programa'),
        ).toBeInTheDocument();
    });

    it('menu ⋯ do programa enviado tem as cinco ações na ordem, sem Excluir', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await screen.findByRole('button', { name: 'Mais ações' }),
        );

        expect(
            screen.getAllByRole('menuitem').map((i) => i.textContent),
        ).toEqual([
            'Copiar link do programa',
            'Baixar PDF',
            'Texto para prontuário',
            'Duplicar',
            'Transformar em modelo',
        ]);
    });

    it('no rascunho o menu tem as seis ações, com Copiar link desabilitado', async () => {
        getById.mockResolvedValue(
            program({ status: 'draft', patientViewedAt: null }),
        );
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await screen.findByRole('button', { name: 'Mais ações' }),
        );

        const items = screen.getAllByRole('menuitem');
        expect(items.map((i) => i.textContent)).toEqual([
            'Copiar link do programa',
            'Baixar PDF',
            'Texto para prontuário',
            'Duplicar',
            'Transformar em modelo',
            'Excluir rascunho',
        ]);
        expect(items[0]).toHaveAttribute('aria-disabled', 'true');
        expect(items[1]).not.toHaveAttribute('aria-disabled');
        expect(items[5]).not.toHaveAttribute('aria-disabled');
    });

    it('programa sem paciente deixa Copiar link desabilitado', async () => {
        getById.mockResolvedValue(
            program({ patientId: null, patientName: null }),
        );
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await screen.findByRole('button', { name: 'Mais ações' }),
        );

        expect(
            screen.getByRole('menuitem', { name: 'Copiar link do programa' }),
        ).toHaveAttribute('aria-disabled', 'true');
    });

    it.each(['physiotherapist', 'secretary'])(
        '%s vê Excluir rascunho desabilitado',
        async (role) => {
            authRole = role;
            getById.mockResolvedValue(
                program({ status: 'draft', patientViewedAt: null }),
            );
            const user = userEvent.setup();
            renderPage();

            await user.click(
                await screen.findByRole('button', { name: 'Mais ações' }),
            );

            expect(
                screen.getByRole('menuitem', { name: 'Excluir rascunho' }),
            ).toHaveAttribute('aria-disabled', 'true');
        },
    );

    it('Duplicar abre a cópia', async () => {
        duplicateProgram.mockResolvedValue(
            program({ id: '77', title: 'Cópia de Prevenção de Quedas' }),
        );
        getById.mockImplementation(async (id: string) =>
            id === '77'
                ? program({ id: '77', title: 'Cópia de Prevenção de Quedas' })
                : program(),
        );
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await screen.findByRole('button', { name: 'Mais ações' }),
        );
        await user.click(screen.getByRole('menuitem', { name: 'Duplicar' }));

        expect(duplicateProgram).toHaveBeenCalledWith('6');
        expect(
            await screen.findByRole('heading', {
                level: 1,
                name: 'Cópia de Prevenção de Quedas',
            }),
        ).toBeInTheDocument();
        expect(getById).toHaveBeenCalledWith('77');
    });

    it('admin exclui o rascunho, confirma e volta ao Histórico', async () => {
        getById.mockResolvedValue(
            program({ status: 'draft', patientViewedAt: null }),
        );
        destroyProgram.mockResolvedValue(undefined);
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await screen.findByRole('button', { name: 'Mais ações' }),
        );
        await user.click(
            screen.getByRole('menuitem', { name: 'Excluir rascunho' }),
        );
        await user.click(screen.getByRole('button', { name: 'Excluir' }));

        expect(destroyProgram).toHaveBeenCalledWith('6');
        expect(
            await screen.findByText(
                /^histórico \/clinica\/programas\/historico/,
            ),
        ).toBeInTheDocument();
    });

    it('Copiar link copia o link do programa e Baixar PDF baixa o PDF', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await screen.findByRole('button', { name: 'Mais ações' }),
        );
        await user.click(
            screen.getByRole('menuitem', { name: 'Copiar link do programa' }),
        );
        await vi.waitFor(async () =>
            expect(await navigator.clipboard.readText()).toBe(
                'https://exemplo.test/p/6',
            ),
        );

        await user.click(screen.getByRole('button', { name: 'Mais ações' }));
        await user.click(screen.getByRole('menuitem', { name: 'Baixar PDF' }));
        expect(downloadPdf).toHaveBeenCalledWith('6');
    });

    it('WhatsApp abre o wa.me do paciente com a mensagem e o link do programa', async () => {
        getById.mockResolvedValue(program({ patientPhone: '(11) 98765-4321' }));
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await screen.findByRole('button', { name: 'WhatsApp' }),
        );

        expect(open).toHaveBeenCalledWith(
            expect.stringMatching(/^https:\/\/wa\.me\/11987654321\?text=/),
            '_blank',
            'noopener,noreferrer',
        );
        const text = new URL(open.mock.calls[0]![0] as string).searchParams.get(
            'text',
        );
        expect(text).toContain('Acesse: https://exemplo.test/p/6');
        open.mockRestore();
    });

    it('WhatsApp fica desabilitado, com a dica, quando o paciente não tem telefone', async () => {
        const user = userEvent.setup();
        renderPage();

        const button = await screen.findByRole('button', { name: 'WhatsApp' });
        expect(button).toBeDisabled();

        await user.hover(button.parentElement!);
        expect(
            (await screen.findAllByText('Paciente sem telefone'))[0],
        ).toBeInTheDocument();
    });

    it('WhatsApp fica desabilitado no rascunho mesmo com telefone', async () => {
        getById.mockResolvedValue(
            program({
                status: 'draft',
                patientViewedAt: null,
                patientPhone: '(11) 98765-4321',
            }),
        );
        renderPage();

        expect(
            await screen.findByRole('button', { name: 'WhatsApp' }),
        ).toBeDisabled();
    });

    it('programa sem paciente não mostra WhatsApp', async () => {
        getById.mockResolvedValue(
            program({ patientId: null, patientName: null }),
        );
        renderPage();

        await screen.findByRole('button', { name: 'Editar' });
        expect(
            screen.queryByRole('button', { name: 'WhatsApp' }),
        ).not.toBeInTheDocument();
    });

    it('"Voltar" volta para a origem com a busca', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/programas/6', {
            from: '/clinica/programas/historico?patientId=48',
        });

        await user.click(await screen.findByRole('button', { name: 'Voltar' }));

        expect(
            screen.getByText(
                'histórico /clinica/programas/historico?patientId=48',
            ),
        ).toBeInTheDocument();
    });

    it('"Voltar" volta ao prontuário quando veio de lá', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/programas/6', { from: '/clinica/pacientes/48' });

        await user.click(await screen.findByRole('button', { name: 'Voltar' }));

        expect(
            screen.getByText('prontuário /clinica/pacientes/48'),
        ).toBeInTheDocument();
    });

    it('"Voltar" leva ao Histórico quando entrou direto pela URL', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(await screen.findByRole('button', { name: 'Voltar' }));

        expect(
            screen.getByText('histórico /clinica/programas/historico'),
        ).toBeInTheDocument();
    });

    it('depois de duplicar, "Voltar" na cópia volta para a origem do original', async () => {
        duplicateProgram.mockResolvedValue(
            program({ id: '77', title: 'Cópia' }),
        );
        getById.mockImplementation(async (id: string) =>
            id === '77' ? program({ id: '77', title: 'Cópia' }) : program(),
        );
        const user = userEvent.setup();
        renderPage('/clinica/programas/6', {
            from: '/clinica/programas/historico?patientId=48',
        });

        await user.click(
            await screen.findByRole('button', { name: 'Mais ações' }),
        );
        await user.click(screen.getByRole('menuitem', { name: 'Duplicar' }));
        await screen.findByRole('heading', { level: 1, name: 'Cópia' });
        await user.click(screen.getByRole('button', { name: 'Voltar' }));

        expect(
            screen.getByText(
                'histórico /clinica/programas/historico?patientId=48',
            ),
        ).toBeInTheDocument();
    });

    it('Texto para prontuário copia o texto e Transformar em modelo continua no programa', async () => {
        toModelProgram.mockResolvedValue(program({ id: '90' }));
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await screen.findByRole('button', { name: 'Mais ações' }),
        );
        await user.click(
            screen.getByRole('menuitem', { name: 'Texto para prontuário' }),
        );
        await vi.waitFor(async () =>
            expect(await navigator.clipboard.readText()).toContain(
                'Ponte Glútea',
            ),
        );

        await user.click(screen.getByRole('button', { name: 'Mais ações' }));
        await user.click(
            screen.getByRole('menuitem', { name: 'Transformar em modelo' }),
        );
        await vi.waitFor(() =>
            expect(toModelProgram).toHaveBeenCalledWith('6'),
        );
        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Prevenção de Quedas — Equilíbrio e Marcha',
            }),
        ).toBeInTheDocument();
    });

    it('não mostra mais o link "← Programas"', async () => {
        renderPage();

        await screen.findByRole('button', { name: 'Voltar' });
        expect(
            screen.queryByRole('link', { name: 'Programas' }),
        ).not.toBeInTheDocument();
    });
});
