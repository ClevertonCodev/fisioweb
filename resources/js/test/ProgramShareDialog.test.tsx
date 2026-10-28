import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProgramShareDialog } from '@/components/clinic/program/ProgramShareDialog';
import type { Program } from '@/domain/clinic';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const program: Program = {
    id: '6',
    title: 'Prevenção de Quedas',
    patientId: '48',
    patientName: 'Ana',
    patientPhotoUrl: null,
    patientPhone: '(11) 98765-4321',
    patientEmail: 'ana@exemplo.test',
    shareUrl: 'https://exemplo.test/p/6',
    professionalId: '1',
    professionalName: 'Fisio',
    professionalPhotoUrl: null,
    exerciseCount: 0,
    startDate: null,
    endDate: null,
    message: 'Em caso de dor, pare.',
    groups: [],
    status: 'active',
    patientViewedAt: null,
    patientCompletedCount: 0,
    createdAt: '2026-10-01T00:00:00Z',
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('ProgramShareDialog', () => {
    it('WhatsApp abre o wa.me com o texto de sempre', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        const user = userEvent.setup();
        render(
            <ProgramShareDialog
                open
                phase="ready"
                program={program}
                onOpenChange={vi.fn()}
                onDone={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('button', { name: /WhatsApp Web/ }));

        expect(open).toHaveBeenCalledWith(
            'https://wa.me/11987654321?text=' +
                encodeURIComponent(
                    'Olá, Ana!\n\nSeu programa de tratamento "Prevenção de Quedas" já está disponível.\n\nEm caso de dor, pare.\n\nAcesse: https://exemplo.test/p/6',
                ),
            '_blank',
            'noopener,noreferrer',
        );
    });
});
