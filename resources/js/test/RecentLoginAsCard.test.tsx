import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RecentLoginAsCard } from '@/pages/admin/clinic/RecentLoginAsCard';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('RecentLoginAsCard', () => {
    it('mostra duas entradas do mesmo operador no mesmo segundo sem repetir a chave', () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        const entry = {
            operatorName: 'Operadora Ana',
            clinicUserName: 'Mestre da Clínica',
            createdAt: '2026-11-08T13:45:00-03:00',
        };

        render(<RecentLoginAsCard entries={[entry, { ...entry }]} />);

        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(
            consoleError.mock.calls.some((args) =>
                String(args[0]).includes('same key'),
            ),
        ).toBe(false);
    });
});
