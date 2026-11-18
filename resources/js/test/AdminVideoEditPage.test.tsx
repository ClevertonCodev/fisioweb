import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import AdminVideoEditPage from '@/pages/admin/exercises/AdminVideoEditPage';
import { routerFutureFlags } from '@/test/browser-router';

const getById = vi.fn();

vi.mock('@/infrastructure/repositories', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    apiAdminVideosRepository: {
        getById: (...args: unknown[]) => getById(...args),
    },
}));

vi.mock('@/components/admin/AdminLayout', () => ({
    AdminLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/components/ImageCropModal', () => ({
    ImageCropModal: ({
        open,
        onConfirm,
    }: {
        open: boolean;
        onConfirm: (file: File) => void;
    }) =>
        open ? (
            <button
                type="button"
                onClick={() =>
                    onConfirm(
                        new File(['x'], 'nova-referencia.jpg', {
                            type: 'image/jpeg',
                        }),
                    )
                }
            >
                Aplicar recorte
            </button>
        ) : null,
}));

describe('AdminVideoEditPage ao buscar de novo', () => {
    it('não apaga o nome, a duração e a foto de referência trocada quando o link assinado muda', async () => {
        let assinatura = 0;
        getById.mockImplementation(async () => {
            assinatura += 1;
            return {
                id: 7,
                filename: 'a.mp4',
                original_filename: 'nome-do-servidor.mp4',
                video_url: `https://conta.example/videos/a.mp4?assinatura=${assinatura}`,
                thumbnail_url: `https://conta.example/thumbnails/a.jpg?assinatura=${assinatura}`,
                size: 100,
                human_size: '100 B',
                duration: 30,
                human_duration: '0:30',
                metadata: {
                    reference_images: [
                        {
                            url: `https://conta.example/covers/r1.jpg?assinatura=${assinatura}`,
                        },
                    ],
                },
                status: 'completed',
                mime_type: 'video/mp4',
            };
        });
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter
                    initialEntries={['/admin/videos/7/editar']}
                    future={routerFutureFlags}
                >
                    <Routes>
                        <Route
                            path="/admin/videos/:id/editar"
                            element={<AdminVideoEditPage />}
                        />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        const nome = await screen.findByPlaceholderText('nome-do-video.mp4');
        await waitFor(() => expect(nome).toHaveValue('nome-do-servidor.mp4'));
        fireEvent.change(nome, { target: { value: 'nome-editado.mp4' } });
        fireEvent.change(screen.getByPlaceholderText('Ex: 120'), {
            target: { value: '45' },
        });
        URL.createObjectURL = vi.fn(() => 'blob:previa');
        URL.revokeObjectURL = vi.fn();
        const slot = screen
            .getByAltText('Referência atual')
            .closest('div')
            ?.parentElement?.querySelector(
                'input[type="file"]',
            ) as HTMLInputElement;
        fireEvent.change(slot, {
            target: {
                files: [new File(['x'], 'r.jpg', { type: 'image/jpeg' })],
            },
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Aplicar recorte' }),
        );
        expect(
            screen.getByText('nova-referencia.jpg (será substituída)'),
        ).toBeInTheDocument();

        await queryClient.refetchQueries({ queryKey: ['admin', 'video', 7] });
        await waitFor(() => expect(getById).toHaveBeenCalledTimes(2));

        expect(screen.getByPlaceholderText('nome-do-video.mp4')).toHaveValue(
            'nome-editado.mp4',
        );
        expect(screen.getByPlaceholderText('Ex: 120')).toHaveValue(45);
        expect(
            screen.getByText('nova-referencia.jpg (será substituída)'),
        ).toBeInTheDocument();
    });
});
