import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fromExercise } from '@/application/clinic/program-builder';
import { downloadProtectedMedia } from '@/application/protected-media';
import { ExerciseCard } from '@/components/ExerciseCard';
import { ProtectedImage } from '@/components/protected-media/ProtectedImage';
import { ProtectedVideo } from '@/components/protected-media/ProtectedVideo';
import { useProtectedPlayback } from '@/components/protected-media/use-protected-playback';
import { TooltipProvider } from '@/components/ui/tooltip';
import { VideoThumb } from '@/components/VideoThumb';
import type { Exercise } from '@/domain/clinic';
import { apiClient } from '@/infrastructure/api/client';
import { storageClient } from '@/infrastructure/api/storage-client';
import {
    CardVideo,
    ItemMediaSource,
    ModalPlayer,
} from '@/pages/clinic/program/exercise-library/media';

const get = vi.spyOn(storageClient, 'get');

function blobResponse(status: number) {
    return { status, data: new Blob(['video']) };
}

function Harness({ first, second }: { first: string; second: string }) {
    const [url, setUrl] = useState(first);
    const playback = useProtectedPlayback({
        url,
        onRefresh: async () => {
            setUrl(second);
            return second;
        },
    });
    return (
        <>
            <button type="button" onClick={() => void playback.play()}>
                Reproduzir
            </button>
            {playback.error && <p>{playback.error}</p>}
            <video {...playback.videoProps} />
        </>
    );
}

describe('mídia protegida', () => {
    beforeEach(() => {
        get.mockReset();
        vi.stubGlobal('URL', {
            createObjectURL: vi.fn(() => 'blob:video-teste'),
            revokeObjectURL: vi.fn(),
        });
        HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
        HTMLMediaElement.prototype.pause = vi.fn();
        HTMLMediaElement.prototype.load = vi.fn();
    });

    it('não baixa o vídeo antes do play e o download não leva Authorization', async () => {
        get.mockResolvedValue(blobResponse(200));
        render(
            <Harness
                first="https://conta.example/video.mp4"
                second="https://conta.example/novo.mp4"
            />,
        );

        expect(get).not.toHaveBeenCalled();
        const video = document.querySelector('video');
        expect(video?.getAttribute('src')).toBeNull();
        expect(video).toHaveAttribute('controlslist', 'nodownload');

        await userEvent.click(
            screen.getByRole('button', { name: 'Reproduzir' }),
        );

        expect(get).toHaveBeenCalledTimes(1);
        expect(get.mock.calls[0][0]).toBe('https://conta.example/video.mp4');
        expect(video?.src).toContain('blob:video-teste');
    });

    it('o pedido que sai para o armazenamento não leva Authorization', async () => {
        get.mockImplementation((url, config) =>
            storageClient.request({ ...config, url, method: 'get' }),
        );
        const sent: Array<Record<string, unknown>> = [];
        const originalAdapter = storageClient.defaults.adapter;
        axios.defaults.headers.common.Authorization = 'Bearer jwt-da-sessao';
        storageClient.defaults.headers.common.Authorization =
            'Bearer jwt-da-sessao';
        storageClient.defaults.adapter = async (config) => {
            sent.push({ ...config.headers });
            return {
                data: new Blob(['video']),
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
            };
        };

        try {
            await downloadProtectedMedia('https://conta.example/video.mp4');
        } finally {
            storageClient.defaults.adapter = originalAdapter;
            delete axios.defaults.headers.common.Authorization;
            delete storageClient.defaults.headers.common.Authorization;
        }

        expect(sent).toHaveLength(1);
        expect(sent[0].Authorization).toBeUndefined();
    });

    it('libera o blob ao desmontar', async () => {
        get.mockResolvedValue(blobResponse(200));
        const view = render(
            <Harness
                first="https://conta.example/video.mp4"
                second="https://conta.example/novo.mp4"
            />,
        );
        await userEvent.click(
            screen.getByRole('button', { name: 'Reproduzir' }),
        );
        view.unmount();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:video-teste');
    });

    it('pede um link novo quando o download responde 403 e toca', async () => {
        get.mockResolvedValueOnce(blobResponse(403)).mockResolvedValueOnce(
            blobResponse(200),
        );
        render(
            <Harness
                first="https://conta.example/vencido.mp4"
                second="https://conta.example/novo.mp4"
            />,
        );

        await userEvent.click(
            screen.getByRole('button', { name: 'Reproduzir' }),
        );

        expect(get).toHaveBeenCalledTimes(2);
        expect(get.mock.calls[1][0]).toBe('https://conta.example/novo.mp4');
        expect(document.querySelector('video')?.src).toContain(
            'blob:video-teste',
        );
    });

    it('dois cliques no play enquanto baixa fazem um download só', async () => {
        let finish: (value: ReturnType<typeof blobResponse>) => void = () => {};
        get.mockReturnValue(
            new Promise((resolve) => {
                finish = resolve;
            }) as ReturnType<typeof storageClient.get>,
        );
        render(
            <Harness
                first="https://conta.example/video.mp4"
                second="https://conta.example/novo.mp4"
            />,
        );
        const button = screen.getByRole('button', { name: 'Reproduzir' });

        fireEvent.click(button);
        fireEvent.click(button);
        finish(blobResponse(200));

        await waitFor(() =>
            expect(document.querySelector('video')?.src).toContain(
                'blob:video-teste',
            ),
        );
        expect(get).toHaveBeenCalledTimes(1);
    });

    it('fechar a tela no meio do download não cria blob sem dono', async () => {
        let finish: (value: ReturnType<typeof blobResponse>) => void = () => {};
        get.mockReturnValue(
            new Promise((resolve) => {
                finish = resolve;
            }) as ReturnType<typeof storageClient.get>,
        );
        const view = render(
            <Harness
                first="https://conta.example/video.mp4"
                second="https://conta.example/novo.mp4"
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Reproduzir' }));
        view.unmount();
        finish(blobResponse(200));
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('o vídeo baixado volta a tocar depois de pausa longa sem baixar de novo', async () => {
        get.mockResolvedValue(blobResponse(200));
        render(
            <Harness
                first="https://conta.example/video.mp4"
                second="https://conta.example/novo.mp4"
            />,
        );
        const button = screen.getByRole('button', { name: 'Reproduzir' });
        await userEvent.click(button);
        const video = document.querySelector('video')!;
        Object.defineProperty(video, 'paused', {
            configurable: true,
            value: true,
        });
        get.mockResolvedValue(blobResponse(403));

        await userEvent.click(button);

        expect(get).toHaveBeenCalledTimes(1);
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
    });

    it('tenta o link renovado mesmo quando a API devolve o mesmo texto', async () => {
        get.mockResolvedValueOnce(blobResponse(403)).mockResolvedValueOnce(
            blobResponse(200),
        );
        render(
            <ProtectedVideo
                autoPlay
                videoUrl="https://conta.example/video.mp4?assinatura=1"
                onRefresh={async () =>
                    'https://conta.example/video.mp4?assinatura=1'
                }
            />,
        );

        await waitFor(() =>
            expect(document.querySelector('video')?.src).toContain(
                'blob:video-teste',
            ),
        );
        expect(get).toHaveBeenCalledTimes(2);
        expect(screen.queryByText(/Não foi possível/)).toBeNull();
    });

    it('mostra erro quando o link renovado também falha', async () => {
        get.mockResolvedValue(blobResponse(403));
        render(
            <ProtectedVideo
                autoPlay
                videoUrl="https://conta.example/vencido.mp4"
                onRefresh={async () => 'https://conta.example/novo.mp4'}
            />,
        );

        expect(
            await screen.findByText('Não foi possível carregar o vídeo.'),
        ).toBeInTheDocument();
        expect(get).toHaveBeenCalledTimes(2);
    });

    it.each([
        [
            'VideoThumb',
            () => <VideoThumb videoUrl="https://conta.example/video.mp4" />,
        ],
        [
            'ExerciseCard',
            () => (
                <ExerciseCard
                    title="Agachamento"
                    videoUrl="https://conta.example/video.mp4"
                />
            ),
        ],
    ])(
        '%s não marca como tocando e mostra o erro quando o vídeo falha',
        async (_name, renderPlayer) => {
            get.mockResolvedValue(blobResponse(500));
            render(<TooltipProvider>{renderPlayer()}</TooltipProvider>);

            await userEvent.click(
                screen.getByRole('button', { name: 'Reproduzir' }),
            );

            expect(
                await screen.findByText('Não foi possível carregar o vídeo.'),
            ).toBeInTheDocument();
            expect(
                screen.getByRole('button', { name: 'Reproduzir' }),
            ).toBeInTheDocument();
        },
    );

    it.each([
        ['VideoThumb', (url: string) => <VideoThumb videoUrl={url} />],
        [
            'ExerciseCard',
            (url: string) => (
                <ExerciseCard title="Agachamento" videoUrl={url} />
            ),
        ],
    ])(
        '%s não leva o erro do vídeo antigo para o novo',
        async (_name, renderPlayer) => {
            let fail: (
                value: ReturnType<typeof blobResponse>,
            ) => void = () => {};
            get.mockReturnValueOnce(
                new Promise((resolve) => {
                    fail = resolve;
                }) as ReturnType<typeof storageClient.get>,
            );
            const view = render(
                <TooltipProvider>
                    {renderPlayer('https://conta.example/videos/a.mp4')}
                </TooltipProvider>,
            );

            fireEvent.click(screen.getByRole('button', { name: 'Reproduzir' }));
            view.rerender(
                <TooltipProvider>
                    {renderPlayer('https://conta.example/videos/b.mp4')}
                </TooltipProvider>,
            );
            fail(blobResponse(500));
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(screen.queryByText(/Não foi possível/)).toBeNull();
        },
    );

    it.each([
        [
            'CardVideo',
            (exercise: Exercise) => <CardVideo exercise={exercise} />,
            'Reproduzir A',
        ],
        [
            'ModalPlayer',
            (exercise: Exercise) => <ModalPlayer exercise={exercise} />,
            'Reproduzir',
        ],
    ])(
        '%s da biblioteca não leva o erro do vídeo antigo para o novo',
        async (_name, renderPlayer, playName) => {
            let fail: (
                value: ReturnType<typeof blobResponse>,
            ) => void = () => {};
            get.mockReturnValueOnce(
                new Promise((resolve) => {
                    fail = resolve;
                }) as ReturnType<typeof storageClient.get>,
            );
            const queryClient = new QueryClient();
            const exercise = (id: string, file: string) =>
                ({
                    id,
                    title: 'A',
                    videoUrl: `https://conta.example/videos/${file}`,
                    thumbnailUrl: null,
                }) as unknown as Exercise;
            const view = render(
                <QueryClientProvider client={queryClient}>
                    {renderPlayer(exercise('1', 'a.mp4'))}
                </QueryClientProvider>,
            );

            fireEvent.click(
                screen.getAllByRole('button', { name: playName })[0],
            );
            view.rerender(
                <QueryClientProvider client={queryClient}>
                    {renderPlayer(exercise('1', 'b.mp4'))}
                </QueryClientProvider>,
            );
            fail(blobResponse(500));
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(screen.queryByText(/Não foi possível/)).toBeNull();
        },
    );

    it('o CardVideo do montador pede o link novo pelo id do exercício, não pelo id do item', async () => {
        get.mockResolvedValue(blobResponse(403));
        const api = vi
            .spyOn(apiClient, 'get')
            .mockResolvedValue({ data: { data: null } });
        const item = fromExercise({
            id: '12',
            title: 'A',
            videoUrl: 'https://conta.example/videos/a.mp4?s=1',
            thumbnailUrl: '',
        } as unknown as Exercise);
        render(
            <QueryClientProvider client={new QueryClient()}>
                <CardVideo exercise={item} />
            </QueryClientProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Reproduzir A' }));

        await waitFor(() => expect(api).toHaveBeenCalled());
        expect(item.id).not.toBe('12');
        expect(api.mock.calls[0][0]).toBe('/clinic/exercises/12');
        api.mockRestore();
    });

    it('o CardVideo busca o item na origem quando o exercício não volta (exercício desativado)', async () => {
        get.mockResolvedValueOnce(blobResponse(403)).mockResolvedValue(
            blobResponse(200),
        );
        const api = vi
            .spyOn(apiClient, 'get')
            .mockRejectedValue(new Error('404'));
        const source = vi.fn().mockResolvedValue({
            videoUrl: 'https://conta.example/videos/a.mp4?s=2',
            thumbnailUrl: null,
        });
        const item = fromExercise({
            id: '12',
            title: 'A',
            videoUrl: 'https://conta.example/videos/a.mp4?s=1',
            thumbnailUrl: '',
        } as unknown as Exercise);
        render(
            <QueryClientProvider
                client={
                    new QueryClient({
                        defaultOptions: { queries: { retry: false } },
                    })
                }
            >
                <ItemMediaSource value={source}>
                    <CardVideo exercise={item} />
                </ItemMediaSource>
            </QueryClientProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Reproduzir A' }));

        await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
        expect(api.mock.calls[0][0]).toBe('/clinic/exercises/12');
        expect(source).toHaveBeenCalledWith(item.id);
        expect(get.mock.calls[1][0]).toBe(
            'https://conta.example/videos/a.mp4?s=2',
        );
        api.mockRestore();
    });

    it('trocar para outro vídeo no mesmo player baixa o vídeo novo', async () => {
        get.mockResolvedValue(blobResponse(200));
        function Troca() {
            const [url, setUrl] = useState(
                'https://conta.example/videos/a.mp4?assinatura=1',
            );
            const playback = useProtectedPlayback({ url });
            return (
                <>
                    <button type="button" onClick={() => void playback.play()}>
                        Reproduzir
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            setUrl(
                                'https://conta.example/videos/b.mp4?assinatura=1',
                            )
                        }
                    >
                        Próximo
                    </button>
                    <span>{playback.active ? 'ativo' : 'parado'}</span>
                    <video {...playback.videoProps} />
                </>
            );
        }
        render(<Troca />);
        const play = screen.getByRole('button', { name: 'Reproduzir' });

        await userEvent.click(play);
        await userEvent.click(screen.getByRole('button', { name: 'Próximo' }));
        expect(screen.getByText('parado')).toBeInTheDocument();
        await userEvent.click(play);

        expect(get).toHaveBeenCalledTimes(2);
        expect(get.mock.calls[1][0]).toBe(
            'https://conta.example/videos/b.mp4?assinatura=1',
        );
    });

    it('a recusa do play pelo navegador não vira erro e o toque seguinte toca', async () => {
        get.mockResolvedValue(blobResponse(200));
        const play = vi
            .fn()
            .mockRejectedValueOnce(
                new DOMException('play() failed', 'NotAllowedError'),
            )
            .mockResolvedValue(undefined);
        HTMLMediaElement.prototype.play = play;
        render(
            <Harness
                first="https://conta.example/videos/a.mp4"
                second="https://conta.example/videos/b.mp4"
            />,
        );
        const button = screen.getByRole('button', { name: 'Reproduzir' });

        await userEvent.click(button);
        expect(screen.queryByText(/Não foi possível|failed/)).toBeNull();
        const video = document.querySelector('video')!;
        Object.defineProperty(video, 'paused', {
            configurable: true,
            value: true,
        });
        await userEvent.click(button);

        expect(play).toHaveBeenCalledTimes(2);
        expect(get).toHaveBeenCalledTimes(1);
    });

    it('o vídeo pedido antes não começa sozinho quando outro foi pedido depois', async () => {
        const finishes: Array<
            (value: ReturnType<typeof blobResponse>) => void
        > = [];
        get.mockImplementation(
            () =>
                new Promise((resolve) => {
                    finishes.push(resolve);
                }) as ReturnType<typeof storageClient.get>,
        );
        function Dois() {
            const a = useProtectedPlayback({
                url: 'https://conta.example/videos/a.mp4',
            });
            const b = useProtectedPlayback({
                url: 'https://conta.example/videos/b.mp4',
            });
            return (
                <>
                    <button type="button" onClick={() => void a.play()}>
                        A
                    </button>
                    <button type="button" onClick={() => void b.play()}>
                        B
                    </button>
                    <video data-testid="a" {...a.videoProps} />
                    <video data-testid="b" {...b.videoProps} />
                </>
            );
        }
        render(<Dois />);

        fireEvent.click(screen.getByRole('button', { name: 'A' }));
        fireEvent.click(screen.getByRole('button', { name: 'B' }));
        finishes[0](blobResponse(200));
        finishes[1](blobResponse(200));

        await waitFor(() =>
            expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1),
        );
        expect(
            vi.mocked(HTMLMediaElement.prototype.play).mock.contexts[0],
        ).toBe(screen.getByTestId('b'));
    });

    it('trocar de vídeo durante o download baixa o vídeo novo e esvazia o player', async () => {
        const finishes: Array<
            (value: ReturnType<typeof blobResponse>) => void
        > = [];
        get.mockImplementation(
            () =>
                new Promise((resolve) => {
                    finishes.push(resolve);
                }) as ReturnType<typeof storageClient.get>,
        );
        const load = vi.fn();
        HTMLMediaElement.prototype.load = load;
        function Troca() {
            const [url, setUrl] = useState(
                'https://conta.example/videos/a.mp4?s=1',
            );
            const playback = useProtectedPlayback({ url });
            return (
                <>
                    <button type="button" onClick={() => void playback.play()}>
                        Reproduzir
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            setUrl('https://conta.example/videos/b.mp4?s=1')
                        }
                    >
                        Próximo
                    </button>
                    <video {...playback.videoProps} />
                </>
            );
        }
        vi.mocked(URL.createObjectURL).mockImplementation(
            () =>
                `blob:video-${vi.mocked(URL.createObjectURL).mock.calls.length}`,
        );
        render(<Troca />);

        fireEvent.click(screen.getByRole('button', { name: 'Reproduzir' }));
        fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
        await waitFor(() => expect(load).toHaveBeenCalled());
        finishes[0](blobResponse(200));
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(URL.createObjectURL).not.toHaveBeenCalled();
        expect(document.querySelector('video')?.getAttribute('src')).toBeNull();
        expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Reproduzir' }));
        await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
        finishes[1](blobResponse(200));

        expect(get.mock.calls[1][0]).toBe(
            'https://conta.example/videos/b.mp4?s=1',
        );
        await waitFor(() =>
            expect(document.querySelector('video')?.getAttribute('src')).toBe(
                'blob:video-1',
            ),
        );
    });

    it('antes do play mostra a capa com um botão, e o vídeo só aparece depois do download', async () => {
        get.mockResolvedValue(blobResponse(200));
        render(
            <ProtectedVideo
                title="Ponte"
                controls
                videoUrl="https://conta.example/videos/ponte.mp4"
                posterUrl="https://conta.example/thumbnails/ponte.jpg"
            />,
        );
        const video = document.querySelector('video')!;

        expect(video).toHaveClass('invisible');
        expect(
            document.querySelector('img[src*="thumbnails/ponte.jpg"]'),
        ).not.toBeNull();
        expect(get).not.toHaveBeenCalled();

        await userEvent.click(
            screen.getByRole('button', { name: 'Reproduzir Ponte' }),
        );

        await waitFor(() => expect(video).not.toHaveClass('invisible'));
        expect(get).toHaveBeenCalledTimes(1);
        expect(
            screen.queryByRole('button', { name: 'Reproduzir Ponte' }),
        ).toBeNull();
    });

    it('sem capa, o botão de reproduzir aparece e baixa o vídeo no clique', async () => {
        get.mockResolvedValue(blobResponse(200));
        render(
            <ProtectedVideo
                title="Ponte"
                controls
                videoUrl="https://conta.example/videos/ponte.mp4"
                posterUrl={null}
            />,
        );

        await userEvent.click(
            screen.getByRole('button', { name: 'Reproduzir Ponte' }),
        );

        expect(get).toHaveBeenCalledTimes(1);
        await waitFor(() =>
            expect(document.querySelector('video')).not.toHaveClass(
                'invisible',
            ),
        );
    });

    it('trocar de vídeo durante o download libera o botão do vídeo novo e descarta o antigo', async () => {
        const finishes: Array<
            (value: ReturnType<typeof blobResponse>) => void
        > = [];
        get.mockImplementation(
            () =>
                new Promise((resolve) => {
                    finishes.push(resolve);
                }) as ReturnType<typeof storageClient.get>,
        );
        vi.mocked(URL.createObjectURL).mockImplementation(
            () =>
                `blob:video-${vi.mocked(URL.createObjectURL).mock.calls.length}`,
        );
        const view = render(
            <ProtectedVideo
                title="A"
                videoUrl="https://conta.example/videos/a.mp4?s=1"
                posterUrl="https://conta.example/thumbnails/a.jpg"
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Reproduzir A' }));
        view.rerender(
            <ProtectedVideo
                title="B"
                videoUrl="https://conta.example/videos/b.mp4?s=1"
                posterUrl="https://conta.example/thumbnails/b.jpg"
            />,
        );
        const playB = screen.getByRole('button', { name: 'Reproduzir B' });
        expect(playB).toBeEnabled();

        finishes[0](blobResponse(200));
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(document.querySelector('video')?.getAttribute('src')).toBeNull();
        expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();

        fireEvent.click(playB);
        await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
        finishes[1](blobResponse(200));

        await waitFor(() =>
            expect(document.querySelector('video')?.getAttribute('src')).toBe(
                'blob:video-1',
            ),
        );
        expect(get.mock.calls[1][0]).toBe(
            'https://conta.example/videos/b.mp4?s=1',
        );
        expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    it('o erro do download antigo não aparece no vídeo novo', async () => {
        let fail: (value: ReturnType<typeof blobResponse>) => void = () => {};
        get.mockReturnValue(
            new Promise((resolve) => {
                fail = resolve;
            }) as ReturnType<typeof storageClient.get>,
        );
        const view = render(
            <ProtectedVideo
                title="A"
                videoUrl="https://conta.example/videos/a.mp4"
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Reproduzir A' }));
        view.rerender(
            <ProtectedVideo
                title="B"
                videoUrl="https://conta.example/videos/b.mp4"
            />,
        );
        fail(blobResponse(500));
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(screen.queryByText(/Não foi possível/)).toBeNull();
    });

    it('o autoPlay toca uma vez e não retoma o vídeo pausado quando a tela recarrega', async () => {
        get.mockResolvedValue(blobResponse(200));
        const view = render(
            <ProtectedVideo
                autoPlay
                videoUrl="https://conta.example/video.mp4?assinatura=1"
                onRefresh={async () => null}
            />,
        );
        await waitFor(() =>
            expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1),
        );
        const video = document.querySelector('video')!;
        Object.defineProperty(video, 'paused', {
            configurable: true,
            value: true,
        });

        view.rerender(
            <ProtectedVideo
                autoPlay
                videoUrl="https://conta.example/video.mp4?assinatura=2"
                onRefresh={async () => null}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(get).toHaveBeenCalledTimes(1);
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    });

    it('bloqueia o menu de contexto', async () => {
        render(
            <ProtectedVideo
                videoUrl="https://conta.example/video.mp4"
                posterUrl={null}
            />,
        );
        const video = document.querySelector('video')!;
        expect(fireEvent.contextMenu(video)).toBe(false);
    });

    it('a imagem tenta de novo mesmo quando o link renovado tem o mesmo texto', async () => {
        const onRefresh = vi
            .fn()
            .mockResolvedValue('https://conta.example/capa.jpg');
        render(
            <ProtectedImage
                src="https://conta.example/capa.jpg"
                alt="capa"
                onRefresh={onRefresh}
            />,
        );
        const first = screen.getByRole('img', { name: 'capa' });
        fireEvent.error(first);

        await waitFor(() =>
            expect(screen.getByRole('img', { name: 'capa' })).not.toBe(first),
        );
    });

    it('a imagem não deixa erro solto quando o link novo falha', async () => {
        const rejections: unknown[] = [];
        const onUnhandled = (reason: unknown) => rejections.push(reason);
        process.on('unhandledRejection', onUnhandled);
        const onRefresh = vi.fn().mockRejectedValue(new Error('404'));
        render(
            <ProtectedImage
                src="https://conta.example/capa.jpg"
                alt="capa"
                onRefresh={onRefresh}
            />,
        );

        fireEvent.error(screen.getByRole('img', { name: 'capa' }));
        await new Promise((resolve) => setTimeout(resolve, 10));
        process.off('unhandledRejection', onUnhandled);

        expect(onRefresh).toHaveBeenCalledTimes(1);
        expect(rejections).toEqual([]);
    });

    it('a imagem pede um link novo uma vez quando não carrega', async () => {
        const onRefresh = vi
            .fn()
            .mockResolvedValue('https://conta.example/capa-nova.jpg');
        render(
            <ProtectedImage
                src="https://conta.example/capa.jpg"
                alt="capa"
                onRefresh={onRefresh}
            />,
        );
        const image = screen.getByRole('img', { name: 'capa' });
        fireEvent.error(image);
        fireEvent.error(image);
        await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    });
});
