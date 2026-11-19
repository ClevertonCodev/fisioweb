import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    SendToPatientModal,
    type SendToPatientModalProps,
} from '@/components/clinic/SendToPatientModal';

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

function renderModal(overrides: Partial<SendToPatientModalProps> = {}) {
    const props: SendToPatientModalProps = {
        open: true,
        onClose: vi.fn(),
        meta: 'Fortalecimento de joelho',
        description: 'Escolha como o paciente vai receber o link.',
        patientEmail: 'ana@example.test',
        patientPhone: '(11) 98765-4321',
        whatsappUrl: 'https://wa.me/11987654321?text=Ola',
        shareUrl: 'https://app.test/clinica/paciente/programas/abc',
        onSendEmail: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };

    return {
        ...render(<SendToPatientModal {...props} />),
        props,
    };
}

describe('SendToPatientModal (variante C)', () => {
    beforeAll(() => {
        global.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('envia e-mail, mostra "Enviado <hora>" e "Reenviar" e troca o rodapé para "Concluir"', async () => {
        const user = userEvent.setup();
        const { props } = renderModal();

        const dialog = screen.getByRole('dialog', {
            name: 'Enviar ao paciente',
        });
        expect(
            within(dialog).getAllByRole('button', { name: 'Fechar' }),
        ).toHaveLength(2);
        expect(
            within(dialog).queryByRole('button', { name: 'Concluir' }),
        ).not.toBeInTheDocument();

        await user.click(
            within(dialog).getByRole('button', { name: 'Enviar' }),
        );

        expect(props.onSendEmail).toHaveBeenCalledTimes(1);
        expect(
            await within(dialog).findByText(/^Enviado \d{2}:\d{2}$/),
        ).toBeInTheDocument();
        expect(
            within(dialog).getByRole('button', { name: 'Reenviar' }),
        ).toBeInTheDocument();
        expect(
            within(dialog).getByRole('button', { name: 'Concluir' }),
        ).toBeInTheDocument();
        expect(
            within(dialog).getAllByRole('button', { name: 'Fechar' }),
        ).toHaveLength(1);
        expect(toast.success).toHaveBeenCalledWith(
            'E-mail enviado para ana@example.test',
        );
    });

    it('desabilita o botão de e-mail com o motivo quando o paciente não tem e-mail', () => {
        renderModal({ patientEmail: null });

        const dialog = screen.getByRole('dialog', {
            name: 'Enviar ao paciente',
        });
        expect(
            within(dialog).getByText('Paciente sem e-mail cadastrado'),
        ).toBeInTheDocument();
        expect(
            within(dialog).getByRole('button', { name: 'Enviar' }),
        ).toBeDisabled();
    });

    it('desabilita o botão de WhatsApp com o motivo quando o paciente não tem celular ou o telefone não tem dígitos', () => {
        const { rerender } = renderModal({
            patientPhone: null,
            whatsappUrl: null,
        });

        const dialog = screen.getByRole('dialog', {
            name: 'Enviar ao paciente',
        });
        expect(
            within(dialog).getByText('Paciente sem celular cadastrado'),
        ).toBeInTheDocument();
        expect(
            within(dialog).getByRole('button', { name: 'Abrir' }),
        ).toBeDisabled();

        rerender(
            <SendToPatientModal
                open
                onClose={vi.fn()}
                meta="Fortalecimento de joelho"
                patientEmail="ana@example.test"
                patientPhone="---"
                whatsappUrl={null}
                onSendEmail={vi.fn().mockResolvedValue(undefined)}
            />,
        );
        const refreshed = screen.getByRole('dialog', {
            name: 'Enviar ao paciente',
        });
        expect(
            within(refreshed).getByText('Paciente sem celular cadastrado'),
        ).toBeInTheDocument();
        expect(within(refreshed).queryByText('---')).not.toBeInTheDocument();

        rerender(
            <SendToPatientModal
                open
                onClose={vi.fn()}
                meta="Fortalecimento de joelho"
                patientEmail="ana@example.test"
                patientPhone={null}
                whatsappUrl="https://wa.me/11987654321?text=Ola"
                onSendEmail={vi.fn().mockResolvedValue(undefined)}
            />,
        );
        const withoutPhone = screen.getByRole('dialog', {
            name: 'Enviar ao paciente',
        });
        expect(
            within(withoutPhone).getByText('Paciente sem celular cadastrado'),
        ).toBeInTheDocument();
        expect(
            within(withoutPhone).getByRole('button', { name: 'Abrir' }),
        ).toBeDisabled();
    });

    it('abre WhatsApp, mostra "Aberto <hora>", permite copiar link e usar ambos os canais', async () => {
        const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
        const user = userEvent.setup();
        renderModal();

        const dialog = screen.getByRole('dialog', {
            name: 'Enviar ao paciente',
        });

        await user.click(within(dialog).getByRole('button', { name: 'Abrir' }));

        expect(openSpy).toHaveBeenCalledWith(
            'https://wa.me/11987654321?text=Ola',
            '_blank',
            'noopener,noreferrer',
        );
        expect(
            within(dialog).getByText(/^Aberto \d{2}:\d{2}$/),
        ).toBeInTheDocument();
        expect(
            within(dialog).getByRole('button', { name: 'Concluir' }),
        ).toBeInTheDocument();

        await user.click(
            within(dialog).getByRole('button', { name: 'Copiar' }),
        );
        await waitFor(async () =>
            expect(await navigator.clipboard.readText()).toBe(
                'https://app.test/clinica/paciente/programas/abc',
            ),
        );
        expect(
            within(dialog).getByRole('button', { name: 'Copiado' }),
        ).toBeInTheDocument();

        openSpy.mockRestore();
    });

    it('omite a linha de link quando não há shareUrl e aceita rótulo "Não avisar" no rodapé', () => {
        renderModal({
            title: 'Avisar o paciente?',
            dismissLabel: 'Não avisar',
            shareUrl: null,
        });

        const dialog = screen.getByRole('dialog', {
            name: 'Avisar o paciente?',
        });
        expect(
            within(dialog).queryByRole('button', { name: 'Copiar' }),
        ).not.toBeInTheDocument();
        expect(
            within(dialog).getByRole('button', { name: 'Não avisar' }),
        ).toBeInTheDocument();
    });

    it('mostra toast de erro sem marcar como enviado quando a API falha', async () => {
        const onSendEmail = vi.fn().mockRejectedValueOnce(
            new AxiosError('Too Many Requests', '429', undefined, undefined, {
                status: 429,
                data: {
                    message:
                        'Muitas tentativas de envio. Aguarde um minuto e tente de novo.',
                },
            } as AxiosResponse),
        );
        const user = userEvent.setup();
        renderModal({ onSendEmail });

        const dialog = screen.getByRole('dialog', {
            name: 'Enviar ao paciente',
        });

        await user.click(
            within(dialog).getByRole('button', { name: 'Enviar' }),
        );

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(
                'Muitas tentativas de envio. Aguarde um minuto e tente de novo.',
            ),
        );
        expect(within(dialog).queryByText(/^Enviado /)).not.toBeInTheDocument();
        expect(
            within(dialog).getByRole('button', { name: 'Enviar' }),
        ).toBeEnabled();
    });

    it('esconde detalhe técnico em erro 500 da API', async () => {
        const onSendEmail = vi.fn().mockRejectedValueOnce(
            new AxiosError('Server Error', '500', undefined, undefined, {
                status: 500,
                data: { message: 'SQLSTATE[42P01]: internal error' },
            } as AxiosResponse),
        );
        const user = userEvent.setup();
        renderModal({ onSendEmail });

        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(
                'Não foi possível enviar o e-mail. Tente novamente.',
            ),
        );
    });
});
