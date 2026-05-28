import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PatientPhotoSection } from '@/components/clinic/patient/form/PatientPhotoSection';

// ImageCropModal abre um diálogo complexo — mockamos para isolar o componente
vi.mock('@/components/ImageCropModal', () => ({
    ImageCropModal: ({
        open,
        onConfirm,
        imageFile,
    }: {
        open: boolean;
        onConfirm: (f: File) => void;
        imageFile: File | null;
        onOpenChange: (v: boolean) => void;
    }) =>
        open && imageFile ? (
            <div data-testid="crop-modal">
                <button onClick={() => onConfirm(imageFile)}>Confirmar recorte</button>
            </div>
        ) : null,
}));

function makeFile(name = 'photo.jpg', type = 'image/jpeg', sizeBytes = 512) {
    return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe('PatientPhotoSection', () => {
    it('renderiza botão de escolha e placeholder de ícone sem foto', () => {
        render(<PatientPhotoSection value={null} onChange={() => {}} />);
        expect(screen.getByRole('button', { name: /escolher uma foto/i })).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('exibe foto atual quando currentPhotoUrl é passado sem arquivo local', () => {
        render(
            <PatientPhotoSection
                value={null}
                onChange={() => {}}
                currentPhotoUrl="https://cdn.example.com/photo.jpg"
            />,
        );
        // img com alt="" tem role "presentation" no accessible tree
        const img = document.querySelector('img');
        expect(img).toHaveAttribute('src', 'https://cdn.example.com/photo.jpg');
        expect(screen.getByRole('button', { name: /remover/i })).toBeInTheDocument();
    });

    it('abre crop modal ao selecionar imagem válida e chama onChange após confirmar', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<PatientPhotoSection value={null} onChange={onChange} />);

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = makeFile('foto.jpg', 'image/jpeg');
        await user.upload(input, file);

        // Modal aparece
        expect(await screen.findByTestId('crop-modal')).toBeInTheDocument();

        // Confirma o recorte
        await user.click(screen.getByRole('button', { name: /confirmar recorte/i }));

        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledWith(file);
    });

    it('exibe erro para tipo de arquivo inválido', async () => {
        render(<PatientPhotoSection value={null} onChange={() => {}} />);

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const pdfFile = makeFile('doc.pdf', 'application/pdf');

        // fireEvent bypassa o filtro `accept` do browser — necessário para testar a validação interna
        Object.defineProperty(input, 'files', { value: [pdfFile], configurable: true });
        fireEvent.change(input);

        expect(await screen.findByRole('alert')).toHaveTextContent(/jpeg, png ou webp/i);
        expect(screen.queryByTestId('crop-modal')).not.toBeInTheDocument();
    });

    it('exibe erro para arquivo acima de 2MB', async () => {
        const user = userEvent.setup();
        render(<PatientPhotoSection value={null} onChange={() => {}} />);

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const bigFile = makeFile('big.jpg', 'image/jpeg', 2 * 1024 * 1024 + 1);
        await user.upload(input, bigFile);

        expect(await screen.findByRole('alert')).toHaveTextContent(/2mb/i);
    });

    it('chama onChange(null) ao clicar em Remover', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const file = makeFile();
        render(<PatientPhotoSection value={file} onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: /remover/i }));

        expect(onChange).toHaveBeenCalledWith(null);
    });

    it('oculta botão Remover quando não há arquivo nem foto atual', () => {
        render(<PatientPhotoSection value={null} onChange={() => {}} />);
        expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument();
    });

    it('exibe nome do arquivo selecionado', () => {
        const file = makeFile('minha-foto.jpg', 'image/jpeg');
        render(<PatientPhotoSection value={file} onChange={() => {}} />);
        expect(screen.getByText('minha-foto.jpg')).toBeInTheDocument();
    });
});
