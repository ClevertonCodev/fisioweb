import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DsActionsMenu } from '@/components/ds';

describe('DsActionsMenu', () => {
    it('dispara onSelect no item habilitado e não no desabilitado', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(
            <DsActionsMenu
                items={[
                    { key: 'duplicate', label: 'Duplicar' },
                    {
                        key: 'delete',
                        label: 'Excluir rascunho',
                        danger: true,
                        disabled: true,
                        disabledReason: 'Só o admin da clínica pode excluir.',
                    },
                ]}
                onSelect={onSelect}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Mais ações' }));
        await user.click(screen.getByRole('menuitem', { name: 'Duplicar' }));
        expect(onSelect).toHaveBeenCalledWith('duplicate');

        await user.click(screen.getByRole('button', { name: 'Mais ações' }));
        await user.click(
            screen.getByRole('menuitem', { name: 'Excluir rascunho' }),
        );
        expect(onSelect).not.toHaveBeenCalledWith('delete');
    });
});
