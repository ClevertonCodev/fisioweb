import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SubmitStatus } from '@/application/clinic/use-submit-exercise';
import ClinicSubmitExercisePage from '@/pages/clinic/ClinicSubmitExercisePage';
import * as videoRules from '@/pages/clinic/exercise-submit/video-rules';
import { routerFutureFlags } from '@/test/browser-router';

const submitMock = vi.fn();
const resetMock = vi.fn();
const abortMock = vi.fn();

const submitHookState: {
    status: SubmitStatus;
    progress: number;
    error: string | null;
    warning: string | null;
} = {
    status: 'idle',
    progress: 0,
    error: null,
    warning: null,
};

vi.mock('@/application/clinic', () => ({
    useClinicExerciseOptions: () => ({
        data: [
            { id: 1, name: 'Ortopedia' },
            { id: 2, name: 'Neurologia' },
        ],
    }),
    useSubmitExercise: () => ({
        submit: (...args: unknown[]) => submitMock(...args),
        reset: (...args: unknown[]) => resetMock(...args),
        abort: (...args: unknown[]) => abortMock(...args),
        status: submitHookState.status,
        progress: submitHookState.progress,
        error: submitHookState.error,
        warning: submitHookState.warning,
    }),
}));

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={['/clinica/exercicios/enviar']}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/exercicios/enviar"
                        element={<ClinicSubmitExercisePage />}
                    />
                    <Route
                        path="/clinica/exercicios"
                        element={<div>Página Biblioteca</div>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    submitHookState.status = 'idle';
    submitHookState.progress = 0;
    submitHookState.error = null;
    submitHookState.warning = null;
    submitMock.mockResolvedValue({ id: 99, name: 'Ponte glútea' });
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
});

describe('ClinicSubmitExercisePage (DS v2)', () => {
    it('renderiza as três seções, prévia e checklist e valida campos obrigatórios antes de enviar', async () => {
        const user = userEvent.setup();
        renderPage();

        expect(
            screen.getByRole('heading', { name: 'Enviar exercício' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Vídeo' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Informações' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Imagens (opcional)' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Prévia na biblioteca')).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: /Enviar exercício/i }),
        );

        expect(
            await screen.findByText('Informe o nome do exercício.'),
        ).toBeInTheDocument();
        expect(screen.getByText('Selecione a categoria.')).toBeInTheDocument();
        expect(submitMock).not.toHaveBeenCalled();
    });

    it('bloqueia o envio quando o vídeo selecionado está deitado', async () => {
        const user = userEvent.setup();
        vi.spyOn(videoRules, 'readVideoInfo').mockResolvedValue({
            width: 1280,
            height: 720,
            duration: 20,
            size: 2 * 1024 * 1024,
            type: 'video/mp4',
        });

        const { container } = renderPage();

        await user.type(
            screen.getByLabelText('Nome do exercício'),
            'Ponte glútea',
        );
        await user.selectOptions(screen.getByLabelText('Categoria'), '1');

        const videoInput = container.querySelector(
            'input[type="file"][accept*="video/mp4"]',
        ) as HTMLInputElement;
        const horizontalVideo = new File(
            [new Uint8Array(1024)],
            'deitado.mp4',
            { type: 'video/mp4' },
        );
        fireEvent.change(videoInput, { target: { files: [horizontalVideo] } });

        expect(
            await screen.findByText('Este vídeo ainda não pode ser enviado'),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: /Enviar exercício/i }),
        );

        expect(
            await screen.findByText('Ajuste o vídeo antes de enviar.'),
        ).toBeInTheDocument();
        expect(submitMock).not.toHaveBeenCalled();
    });

    it('mostra "Ajustar vídeo" apenas quando o navegador suporta MediaRecorder + captureStream', async () => {
        vi.spyOn(videoRules, 'readVideoInfo').mockResolvedValue({
            width: 1080,
            height: 1080,
            duration: 30,
            size: 3 * 1024 * 1024,
            type: 'video/mp4',
        });

        const canEditSpy = vi
            .spyOn(videoRules, 'canEditVideoInBrowser')
            .mockReturnValue(false);

        const { container, unmount } = renderPage();
        const videoInput = container.querySelector(
            'input[type="file"][accept*="video/mp4"]',
        ) as HTMLInputElement;
        const validVideo = new File([new Uint8Array(1024)], 'em-pe.mp4', {
            type: 'video/mp4',
        });
        fireEvent.change(videoInput, { target: { files: [validVideo] } });

        await screen.findByText('em-pe.mp4');
        expect(
            screen.queryByRole('button', { name: /Ajustar vídeo/i }),
        ).not.toBeInTheDocument();

        unmount();
        canEditSpy.mockReturnValue(true);

        const rendered = renderPage();
        const videoInput2 = rendered.container.querySelector(
            'input[type="file"][accept*="video/mp4"]',
        ) as HTMLInputElement;
        fireEvent.change(videoInput2, { target: { files: [validVideo] } });

        expect(
            await screen.findByRole('button', { name: /Ajustar vídeo/i }),
        ).toBeInTheDocument();
    });

    it('abre o modal de recorte do DS v2 ao selecionar capa e fotos do PDF e envia para a API', async () => {
        const user = userEvent.setup();
        vi.spyOn(videoRules, 'readVideoInfo').mockResolvedValue({
            width: 1080,
            height: 1080,
            duration: 42,
            size: 4 * 1024 * 1024,
            type: 'video/mp4',
        });

        const { container } = renderPage();

        const videoInput = container.querySelector(
            'input[type="file"][accept*="video/mp4"]',
        ) as HTMLInputElement;
        const validVideo = new File([new Uint8Array(2048)], 'ponte.mp4', {
            type: 'video/mp4',
        });
        fireEvent.change(videoInput, { target: { files: [validVideo] } });
        await screen.findByText('ponte.mp4');

        await user.type(
            screen.getByLabelText('Nome do exercício'),
            'Ponte glútea unilateral',
        );
        await user.selectOptions(screen.getByLabelText('Categoria'), '1');
        await user.type(screen.getByLabelText('Duração (segundos)'), '42');
        await user.type(
            screen.getByLabelText('Como fazer'),
            'Deite de barriga para cima e eleve o quadril.',
        );

        // Seleciona capa → abre modal de recorte no DS v2 → confirma com "Usar imagem inteira"
        const imageInputs = container.querySelectorAll(
            'input[type="file"][accept*="image/jpeg"]',
        );
        const coverFile = new File([new Uint8Array(512)], 'capa.jpg', {
            type: 'image/jpeg',
        });
        fireEvent.change(imageInputs[0]!, { target: { files: [coverFile] } });

        expect(
            await screen.findByRole('dialog', { name: /Recortar Capa/i }),
        ).toBeInTheDocument();
        await user.click(
            screen.getByRole('button', { name: 'Usar imagem inteira' }),
        );

        // Seleciona Foto 1 do PDF
        const ref1File = new File([new Uint8Array(512)], 'inicio.png', {
            type: 'image/png',
        });
        fireEvent.change(imageInputs[1]!, { target: { files: [ref1File] } });
        expect(
            await screen.findByRole('dialog', {
                name: /Recortar Foto 1/i,
            }),
        ).toBeInTheDocument();
        await user.click(
            screen.getByRole('button', { name: 'Usar imagem inteira' }),
        );

        // Seleciona Foto 2 do PDF
        const ref2File = new File([new Uint8Array(512)], 'final.webp', {
            type: 'image/webp',
        });
        fireEvent.change(imageInputs[2]!, { target: { files: [ref2File] } });
        expect(
            await screen.findByRole('dialog', {
                name: /Recortar Foto 2/i,
            }),
        ).toBeInTheDocument();
        await user.click(
            screen.getByRole('button', { name: 'Usar imagem inteira' }),
        );

        await user.click(
            screen.getByRole('button', { name: /Enviar exercício/i }),
        );

        await waitFor(() => {
            expect(submitMock).toHaveBeenCalledTimes(1);
        });
        expect(submitMock).toHaveBeenCalledWith({
            name: 'Ponte glútea unilateral',
            physioAreaId: 1,
            difficultyLevel: 'easy',
            description: 'Deite de barriga para cima e eleve o quadril.',
            duration: 42,
            videoFile: validVideo,
            thumbnailFile: coverFile,
            referenceImages: [ref1File, ref2File],
        });
    });

    it('mostra o cartão de conclusão com "Enviar outro" e "Ir para a biblioteca" (/clinica/exercicios)', async () => {
        const user = userEvent.setup();
        submitHookState.status = 'completed';

        renderPage();

        expect(
            screen.getByRole('heading', {
                name: 'Exercício enviado para revisão',
            }),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Enviar outro' }));
        expect(resetMock).toHaveBeenCalledTimes(1);

        await user.click(
            screen.getByRole('button', { name: 'Ir para a biblioteca' }),
        );
        expect(
            await screen.findByText('Página Biblioteca'),
        ).toBeInTheDocument();
    });

    it('mostra o aviso na conclusão quando as fotos do PDF não foram salvas', () => {
        submitHookState.status = 'completed';
        submitHookState.warning =
            'O exercício foi enviado, mas as fotos do PDF não foram salvas: Erro de rede';

        renderPage();

        expect(
            screen.getByText(
                'O exercício foi enviado, mas as fotos do PDF não foram salvas: Erro de rede',
            ),
        ).toBeInTheDocument();
    });

    it('vale a leitura do último vídeo escolhido, mesmo se a do anterior chegar depois', async () => {
        let resolveFirst: (info: videoRules.VideoInfo) => void = () => {};
        vi.spyOn(videoRules, 'readVideoInfo')
            .mockImplementationOnce(
                () => new Promise((resolve) => (resolveFirst = resolve)),
            )
            .mockResolvedValueOnce({
                width: 1080,
                height: 1080,
                duration: 30,
                size: 3 * 1024 * 1024,
                type: 'video/mp4',
            });

        const { container } = renderPage();
        const videoInput = container.querySelector(
            'input[type="file"][accept*="video/mp4"]',
        ) as HTMLInputElement;
        const pick = (name: string) =>
            fireEvent.change(videoInput, {
                target: {
                    files: [
                        new File([new Uint8Array(1024)], name, {
                            type: 'video/mp4',
                        }),
                    ],
                },
            });

        pick('deitado.mp4');
        pick('em-pe.mp4');
        await screen.findByText('em-pe.mp4');

        await act(async () => {
            resolveFirst({
                width: 1280,
                height: 720,
                duration: 20,
                size: 2 * 1024 * 1024,
                type: 'video/mp4',
            });
        });

        expect(
            screen.queryByText('Este vídeo ainda não pode ser enviado'),
        ).not.toBeInTheDocument();
    });

    it('não envia enquanto o vídeo ainda está sendo lido', async () => {
        const user = userEvent.setup();
        vi.spyOn(videoRules, 'readVideoInfo').mockReturnValue(
            new Promise(() => {}),
        );

        const { container } = renderPage();
        await user.type(
            screen.getByLabelText('Nome do exercício'),
            'Ponte glútea',
        );
        await user.selectOptions(screen.getByLabelText('Categoria'), '1');
        const videoInput = container.querySelector(
            'input[type="file"][accept*="video/mp4"]',
        ) as HTMLInputElement;
        fireEvent.change(videoInput, {
            target: {
                files: [
                    new File([new Uint8Array(1024)], 'ponte.mp4', {
                        type: 'video/mp4',
                    }),
                ],
            },
        });
        await screen.findByText('ponte.mp4');

        await user.click(
            screen.getByRole('button', { name: /Enviar exercício/i }),
        );

        expect(submitMock).not.toHaveBeenCalled();
    });

    it('ignora a falha de leitura de um vídeo que já foi trocado', async () => {
        let rejectFirst: (err: Error) => void = () => {};
        vi.spyOn(videoRules, 'readVideoInfo')
            .mockImplementationOnce(
                () => new Promise((_, reject) => (rejectFirst = reject)),
            )
            .mockResolvedValueOnce({
                width: 1080,
                height: 1080,
                duration: 30,
                size: 3 * 1024 * 1024,
                type: 'video/mp4',
            });

        const { container } = renderPage();
        const videoInput = container.querySelector(
            'input[type="file"][accept*="video/mp4"]',
        ) as HTMLInputElement;
        for (const name of ['corrompido.mp4', 'em-pe.mp4']) {
            fireEvent.change(videoInput, {
                target: {
                    files: [
                        new File([new Uint8Array(1024)], name, {
                            type: 'video/mp4',
                        }),
                    ],
                },
            });
        }
        await screen.findByText('em-pe.mp4');

        await act(async () => {
            rejectFirst(new Error('falhou'));
        });

        expect(
            screen.queryByText('Não foi possível ler este vídeo.'),
        ).not.toBeInTheDocument();
    });
});
