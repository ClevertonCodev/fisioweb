import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mapMediaProposal } from '@/infrastructure/repositories/api-admin-exercise-review';
import AdminExerciseReviewPage from '@/pages/admin/exercises/AdminExerciseReviewPage';
import { TestBrowserRouter } from '@/test/browser-router';

const listPending = vi.fn();
const listMediaProposals = vi.fn();
const approve = vi.fn();
const approveMediaProposal = vi.fn();
const rejectMediaProposal = vi.fn();

vi.mock('@/infrastructure/repositories', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    apiAdminExerciseReviewRepository: {
        pendingCount: vi.fn().mockResolvedValue(0),
        listPending: (...args: unknown[]) => listPending(...args),
        listMediaProposals: (...args: unknown[]) => listMediaProposals(...args),
        approve: (...args: unknown[]) => approve(...args),
        reject: vi.fn(),
        approveMediaProposal: (...args: unknown[]) =>
            approveMediaProposal(...args),
        rejectMediaProposal: (...args: unknown[]) =>
            rejectMediaProposal(...args),
    },
}));

vi.mock('@/components/admin/AdminLayout', () => ({
    AdminLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const apiProposal = {
    video_id: 3,
    proposal_version: 'versao-vista',
    proposed_at: '2026-11-11T10:00:00-03:00',
    proposed_by_clinic_user_id: 36,
    exercise: {
        id: 15,
        name: 'Ponte com elástico',
        review_status: 'approved' as const,
        clinic: { id: 22, name: 'Clínica A' },
    },
    linked_exercises: [
        {
            id: 15,
            name: 'Ponte com elástico',
            review_status: 'approved' as const,
            clinic: { id: 22, name: 'Clínica A' },
        },
        {
            id: 10,
            name: 'Ponte pendente',
            review_status: 'pending' as const,
            clinic: { id: 22, name: 'Clínica A' },
        },
    ],
    current: {
        thumbnail_url: 'https://cdn.test/capa-atual.jpg',
        reference_images: [{ cdn_url: 'https://cdn.test/foto-atual.jpg' }],
    },
    proposed: {
        thumbnail_url: 'https://cdn.test/capa-nova.jpg',
        reference_images: null,
    },
};

function renderPage() {
    render(
        <TestBrowserRouter>
            <AdminExerciseReviewPage />
        </TestBrowserRouter>,
    );
}

function proposalCard() {
    return screen.getByRole('article', {
        name: 'Mídia proposta de Ponte com elástico',
    });
}

beforeEach(() => {
    listPending.mockResolvedValue([]);
    listMediaProposals.mockResolvedValue([mapMediaProposal(apiProposal)]);
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('AdminExerciseReviewPage · Mídia proposta', () => {
    it('avisa quando a fila de propostas não carrega, em vez de dizer que está vazia', async () => {
        listMediaProposals.mockRejectedValue(new Error('falhou'));

        renderPage();

        expect(
            await screen.findByText(
                'Não foi possível carregar a fila de revisão. Recarregue a página.',
            ),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('Nenhum exercício aguardando revisão.'),
        ).not.toBeInTheDocument();
    });

    it('mostra a mídia atual e a proposta lado a lado', async () => {
        renderPage();

        expect(
            await screen.findByRole('heading', { name: 'Mídia proposta' }),
        ).toBeInTheDocument();
        const card = proposalCard();
        expect(within(card).getByText(/Clínica A/)).toBeInTheDocument();
        expect(within(card).getByText(/Ponte pendente/)).toBeInTheDocument();
        expect(
            within(card).getByRole('img', { name: 'Capa atual' }),
        ).toHaveAttribute('src', 'https://cdn.test/capa-atual.jpg');
        expect(
            within(card).getByRole('img', { name: 'Capa proposta' }),
        ).toHaveAttribute('src', 'https://cdn.test/capa-nova.jpg');
        expect(
            within(card).getByRole('img', { name: 'Foto 1 atual' }),
        ).toHaveAttribute('src', 'https://cdn.test/foto-atual.jpg');
        expect(
            within(card).getByText('Fotos do PDF sem mudança'),
        ).toBeInTheDocument();
    });

    it('aprova com o vídeo e a versão que o operador viu e recarrega a fila', async () => {
        approveMediaProposal.mockResolvedValue(undefined);
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await within(await screen.findByRole('article')).findByRole(
                'button',
                { name: 'Aprovar mídia' },
            ),
        );

        expect(approveMediaProposal).toHaveBeenCalledWith({
            exerciseId: 15,
            videoId: 3,
            version: 'versao-vista',
        });
        await waitFor(() =>
            expect(listMediaProposals).toHaveBeenCalledTimes(2),
        );
        expect(toast.success).toHaveBeenCalled();
    });

    it('rejeita com o vídeo e a versão que o operador viu', async () => {
        rejectMediaProposal.mockResolvedValue(undefined);
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await within(await screen.findByRole('article')).findByRole(
                'button',
                { name: 'Rejeitar mídia' },
            ),
        );

        expect(rejectMediaProposal).toHaveBeenCalledWith({
            exerciseId: 15,
            videoId: 3,
            version: 'versao-vista',
        });
        expect(approveMediaProposal).not.toHaveBeenCalled();
        await waitFor(() =>
            expect(listMediaProposals).toHaveBeenCalledTimes(2),
        );
    });

    it('mostra o motivo do servidor e recarrega a fila quando a proposta mudou', async () => {
        approveMediaProposal.mockRejectedValue({
            response: {
                data: {
                    message:
                        'A proposta mudou desde que a revisão foi aberta. Recarregue a lista e confira a mídia nova.',
                },
            },
        });
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await within(await screen.findByRole('article')).findByRole(
                'button',
                { name: 'Aprovar mídia' },
            ),
        );

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(
                'A proposta mudou desde que a revisão foi aberta. Recarregue a lista e confira a mídia nova.',
            ),
        );
        await waitFor(() =>
            expect(listMediaProposals).toHaveBeenCalledTimes(2),
        );
    });

    it('mostra o erro do aprovar exercício pendente e recarrega a fila', async () => {
        listMediaProposals.mockResolvedValue([]);
        listPending.mockResolvedValue([
            {
                id: 10,
                name: 'Ponte pendente',
                difficulty_level: 'easy',
                description: null,
                physio_area: null,
                clinic: null,
                submitted_by_clinic_user: null,
                videos: [],
                created_at: '',
            },
        ]);
        approve.mockRejectedValue({
            response: { data: { message: 'Exercício não encontrado.' } },
        });
        const user = userEvent.setup();
        renderPage();

        await user.click(
            await screen.findByRole('button', { name: 'Aprovar' }),
        );

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(
                'Exercício não encontrado.',
            ),
        );
        await waitFor(() => expect(listPending).toHaveBeenCalledTimes(2));
    });
});

describe('mapMediaProposal', () => {
    it('separa "sem mudança" (nulo) de "sem fotos" (lista vazia)', () => {
        expect(
            mapMediaProposal(apiProposal).proposedReferenceImageUrls,
        ).toBeNull();
        expect(
            mapMediaProposal({
                ...apiProposal,
                proposed: { thumbnail_url: null, reference_images: [] },
            }).proposedReferenceImageUrls,
        ).toEqual([]);
    });
});
