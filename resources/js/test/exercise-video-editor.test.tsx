import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as videoRules from '@/pages/clinic/exercise-submit/video-rules';
import { VideoEditor } from '@/pages/clinic/exercise-submit/VideoEditor';

function renderEditor(width: number, height: number) {
    vi.spyOn(videoRules, 'readVideoInfo').mockResolvedValue({
        width,
        height,
        duration: 20,
        size: 4 * 1024 * 1024,
        type: 'video/mp4',
    });
    return render(
        <VideoEditor
            file={
                new File([new Uint8Array(1024)], 'v.mp4', { type: 'video/mp4' })
            }
            open
            onClose={vi.fn()}
            onApply={vi.fn()}
        />,
    );
}

beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('VideoEditor (corte quadrado)', () => {
    it('vídeo deitado: corta as laterais, deslizando da esquerda para a direita', async () => {
        renderEditor(1920, 1080);

        expect(
            await screen.findByText('O vídeo está mais largo que um quadrado.'),
        ).toBeInTheDocument();
        expect(screen.getByText('Esquerda')).toBeInTheDocument();
        expect(screen.getByText('Direita')).toBeInTheDocument();
        expect(screen.queryByText(/9:16/)).not.toBeInTheDocument();
    });

    it('vídeo em pé: corta em cima e embaixo', async () => {
        renderEditor(720, 1280);

        expect(
            await screen.findByText('O vídeo está mais alto que um quadrado.'),
        ).toBeInTheDocument();
        expect(screen.getByText('Em cima')).toBeInTheDocument();
        expect(screen.getByText('Embaixo')).toBeInTheDocument();
    });

    it('vídeo já quadrado: sem corte, só o trecho', async () => {
        renderEditor(1080, 1080);

        expect(
            await screen.findByText('O vídeo já está quadrado.'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('slider', { name: /Posição do corte/ }),
        ).toBeDisabled();
    });
});
