import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImageSlot } from '@/pages/clinic/exercise-submit/shared';

const bigCrop = new File(
    [new Uint8Array(6 * 1024 * 1024)],
    'inicio-cropped.jpg',
    { type: 'image/jpeg' },
);

// O recorte de verdade passa por canvas, que o jsdom não tem: o modal falso
// devolve direto um arquivo que cresceu no recorte.
vi.mock('@/pages/clinic/exercise-submit/ExerciseImageCropModal', () => ({
    ExerciseImageCropModal: ({
        open,
        onConfirm,
    }: {
        open: boolean;
        onConfirm: (file: File) => void;
    }) =>
        open ? (
            <button type="button" onClick={() => onConfirm(bigCrop)}>
                Aplicar recorte
            </button>
        ) : null,
}));

describe('ImageSlot', () => {
    it('recusa a imagem recortada que passou de 5 MB', () => {
        URL.createObjectURL = vi.fn(() => 'blob:mock-url');
        URL.revokeObjectURL = vi.fn();
        const onFile = vi.fn();
        const { container } = render(
            <ImageSlot
                label="Foto 1"
                hint="JPEG, PNG ou WebP"
                file={null}
                onFile={onFile}
            />,
        );

        const input = container.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        fireEvent.change(input, {
            target: {
                files: [
                    new File([new Uint8Array(1024)], 'inicio.jpg', {
                        type: 'image/jpeg',
                    }),
                ],
            },
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Aplicar recorte' }),
        );

        expect(onFile).not.toHaveBeenCalled();
        expect(
            screen.getByText('A imagem não pode passar de 5 MB.'),
        ).toBeInTheDocument();
    });
});
