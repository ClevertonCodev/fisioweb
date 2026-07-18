import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    getSupportWhatsappHref,
    SupportWhatsappButton,
} from '@/components/clinic/SupportWhatsappButton';

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('getSupportWhatsappHref', () => {
    it('retorna null quando VITE_SUPPORT_WHATSAPP está vazio', () => {
        vi.stubEnv('VITE_SUPPORT_WHATSAPP', '');
        expect(getSupportWhatsappHref()).toBeNull();
    });

    it('monta URL do WhatsApp com mensagem de suporte', () => {
        vi.stubEnv('VITE_SUPPORT_WHATSAPP', '5511999999999');
        expect(getSupportWhatsappHref()).toBe(
            'https://api.whatsapp.com/send?phone=5511999999999&text=Ol%C3%A1%2C%20preciso%20de%20ajuda.',
        );
    });
});

describe('SupportWhatsappButton', () => {
    it('não renderiza quando VITE_SUPPORT_WHATSAPP está vazio', () => {
        vi.stubEnv('VITE_SUPPORT_WHATSAPP', '');
        const { container } = render(<SupportWhatsappButton />);
        expect(container).toBeEmptyDOMElement();
    });

    it('mantém o FAB disponível no código (left-5) quando há número', () => {
        vi.stubEnv('VITE_SUPPORT_WHATSAPP', '5511999999999');
        render(<SupportWhatsappButton />);

        const link = screen.getByRole('link', {
            name: /falar com o suporte no whatsapp/i,
        });
        const wrapper = link.parentElement;
        expect(wrapper).toHaveClass('left-5');
        expect(wrapper).toHaveClass('fixed');
    });
});
