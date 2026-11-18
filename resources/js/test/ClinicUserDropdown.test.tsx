import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ClinicUserDropdown } from '@/components/clinic/ClinicUserDropdown';

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: 1,
            name: 'Cleverton',
            type: 'clinic',
            role: 'admin',
            photoUrl: 'https://conta.example/users/photos/c.jpg?s=1',
        },
        logout: vi.fn(),
        reloadUser: vi.fn(async () => null),
    }),
}));

function renderMenu() {
    return render(
        <MemoryRouter>
            <ClinicUserDropdown placement="sidebar" />
        </MemoryRouter>,
    );
}

describe('avatar do menu da conta', () => {
    it('com a foto carregada, a inicial some', () => {
        renderMenu();

        fireEvent.load(screen.getByRole('img', { name: 'Cleverton' }));

        expect(screen.queryByText('C')).toBeNull();
        expect(screen.getByRole('img', { name: 'Cleverton' })).not.toHaveClass(
            'opacity-0',
        );
    });

    it('enquanto a foto não carrega, mostra só a inicial', () => {
        renderMenu();

        expect(screen.getByText('C')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Cleverton' })).toHaveClass(
            'opacity-0',
        );
    });
});
