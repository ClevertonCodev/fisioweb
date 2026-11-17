import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProtectedImage } from '@/components/protected-media/ProtectedImage';
import { ProtectedVideo } from '@/components/protected-media/ProtectedVideo';
import { useProtectedPlayback } from '@/components/protected-media/use-protected-playback';
import { storageClient } from '@/infrastructure/api/storage-client';

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
        expect(get.mock.calls[0][1]).toMatchObject({
            headers: { Authorization: undefined },
        });
        expect(video?.src).toContain('blob:video-teste');
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
