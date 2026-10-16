import { describe, expect, it } from 'vitest';

import { dsCn } from '@/components/ds/utils/ds-cn';

describe('dsCn', () => {
    it('mantém tamanho de fonte e cor do DS juntos', () => {
        expect(dsCn('text-ds-body-xs text-ds-primary-80')).toBe(
            'text-ds-body-xs text-ds-primary-80',
        );
    });

    it('resolve conflito entre dois tamanhos de fonte do DS', () => {
        expect(dsCn('text-ds-body-xs', 'text-ds-caption')).toBe(
            'text-ds-caption',
        );
    });

    it('resolve conflito entre sombras e entre raios do DS', () => {
        expect(
            dsCn('shadow-ds-xs rounded-ds-md', 'shadow-ds-md rounded-ds-pill'),
        ).toBe('shadow-ds-md rounded-ds-pill');
    });

    it('mantém família e peso da fonte juntos', () => {
        expect(dsCn('font-ds font-medium', 'font-ds-mono')).toBe(
            'font-medium font-ds-mono',
        );
    });

    it('não apaga a altura de linha quando um tamanho do DS vem depois', () => {
        expect(dsCn('leading-none', 'text-ds-caption')).toBe(
            'leading-none text-ds-caption',
        );
        expect(
            dsCn(
                'font-ds text-ds-body-xs leading-none',
                'px-3 py-2 text-ds-caption',
            ),
        ).toBe('font-ds leading-none px-3 py-2 text-ds-caption');
    });

    it('mantém tamanho e cor do DS juntos na mesma string', () => {
        expect(dsCn('text-ds-caption text-ds-primary-80')).toBe(
            'text-ds-caption text-ds-primary-80',
        );
    });

    it('resolve conflito entre tamanho do DS e tamanho do Tailwind', () => {
        expect(dsCn('text-sm', 'text-ds-caption')).toBe('text-ds-caption');
        expect(dsCn('text-ds-caption', 'text-sm')).toBe('text-sm');
    });

    it('resolve conflito entre raios do DS por lado e por canto', () => {
        expect(dsCn('rounded-l-ds-md', 'rounded-l-ds-sm')).toBe(
            'rounded-l-ds-sm',
        );
        expect(dsCn('rounded-t-ds-md', 'rounded-t-none')).toBe(
            'rounded-t-none',
        );
        expect(dsCn('rounded-tl-ds-lg', 'rounded-tl-ds-xs')).toBe(
            'rounded-tl-ds-xs',
        );
        expect(dsCn('rounded-ds-md', 'rounded-l-ds-sm')).toBe(
            'rounded-ds-md rounded-l-ds-sm',
        );
        expect(dsCn('rounded-l-ds-sm', 'rounded-ds-md')).toBe('rounded-ds-md');
    });
});
