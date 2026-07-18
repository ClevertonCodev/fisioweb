import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ProgramWizardNavBar } from '@/components/clinic/program/ProgramWizardNavBar';

describe('ProgramWizardNavBar', () => {
    it('exibe título, Voltar e Avançar', () => {
        render(
            <ProgramWizardNavBar
                title="Configurar exercícios"
                onBack={vi.fn()}
                onNext={vi.fn()}
            />,
        );

        expect(screen.getByText('Configurar exercícios')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /^voltar$/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /^avançar$/i }),
        ).toBeInTheDocument();
    });

    it('agrupa Voltar e Avançar no mesmo lado (Voltar antes de Avançar)', () => {
        render(
            <ProgramWizardNavBar
                title="Configurar exercícios"
                onBack={vi.fn()}
                onNext={vi.fn()}
            />,
        );

        const buttons = screen.getAllByRole('button');
        const backIndex = buttons.findIndex((b) =>
            /^voltar$/i.test(b.textContent ?? ''),
        );
        const nextIndex = buttons.findIndex((b) =>
            /^avançar$/i.test(b.textContent ?? ''),
        );

        expect(backIndex).toBeGreaterThanOrEqual(0);
        expect(nextIndex).toBe(backIndex + 1);
    });

    it('exibe progresso quando informado', () => {
        render(
            <ProgramWizardNavBar
                title="Configurar exercícios"
                onBack={vi.fn()}
                onNext={vi.fn()}
                progress={{ configured: 1, total: 2 }}
            />,
        );

        expect(screen.getByText('1 de 2 editados')).toBeInTheDocument();
    });

    it('chama onBack e onNext', async () => {
        const user = userEvent.setup();
        const onBack = vi.fn();
        const onNext = vi.fn();

        render(
            <ProgramWizardNavBar
                title="Novo programa"
                onBack={onBack}
                onNext={onNext}
            />,
        );

        await user.click(screen.getByRole('button', { name: /^voltar$/i }));
        await user.click(screen.getByRole('button', { name: /^avançar$/i }));

        expect(onBack).toHaveBeenCalledOnce();
        expect(onNext).toHaveBeenCalledOnce();
    });

    it('oculta Avançar quando showNext é false', () => {
        render(
            <ProgramWizardNavBar
                title="Detalhes do programa"
                onBack={vi.fn()}
                showNext={false}
            />,
        );

        expect(
            screen.queryByRole('button', { name: /^avançar$/i }),
        ).not.toBeInTheDocument();
    });
});
