import { describe, expect, it } from 'vitest';

import {
    installmentAmounts,
    parseInstallments,
    toTransactionWriteDto,
    transactionFormDefaults,
    transactionFormSchema,
} from '@/application/clinic/finance-transaction-form';

describe('parcelamento no formulário', () => {
    it('divide como o servidor: o centavo que sobra vai na 1ª', () => {
        expect(installmentAmounts(100, 3)).toEqual({
            first: 33.34,
            others: 33.33,
        });
        expect(installmentAmounts(3000, 10)).toEqual({
            first: 300,
            others: 300,
        });
        expect(installmentAmounts(null, 3)).toBeNull();
    });

    it('aceita de 2 a 48 parcelas', () => {
        expect(parseInstallments('2')).toBe(2);
        expect(parseInstallments(' 48 ')).toBe(48);
        expect(parseInstallments('1')).toBeNull();
        expect(parseInstallments('49')).toBeNull();
        expect(parseInstallments('3,5')).toBeNull();
        expect(parseInstallments('')).toBeNull();
    });

    it('parcelado manda o repeat; sem repetição, não manda', () => {
        const base = {
            ...transactionFormDefaults(
                'saida',
                undefined,
                new Date(2027, 0, 31),
            ),
            amount: 3000,
            description: 'Maca',
            categoryId: '10',
        };

        expect(
            toTransactionWriteDto({
                ...base,
                repeatKind: 'installments',
                installments: '10',
            }).repeat,
        ).toEqual({ kind: 'installments', total: 10 });
        expect(toTransactionWriteDto(base)).not.toHaveProperty('repeat');
    });

    it('parcelado com número fora de 2 a 48 não passa no schema', () => {
        const values = {
            ...transactionFormDefaults('saida'),
            amount: 100,
            description: 'Maca',
            categoryId: '10',
            repeatKind: 'installments' as const,
            installments: '60',
        };

        const result = transactionFormSchema.safeParse(values);

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((i) => i.path.join('.'))).toEqual([
            'installments',
        ]);
    });

    it('cada parcela leva pelo menos R$ 0,01: o erro vai no campo valor', () => {
        const values = (amount: number, installments: string) => ({
            ...transactionFormDefaults('saida'),
            amount,
            description: 'Maca',
            categoryId: '10',
            repeatKind: 'installments' as const,
            installments,
        });

        const result = transactionFormSchema.safeParse(values(0.02, '3'));

        expect(result.success).toBe(false);
        expect(
            result.error?.issues.map(
                (i) => `${i.path.join('.')}: ${i.message}`,
            ),
        ).toEqual([
            'amount: Em 3 parcelas, o valor precisa ser de pelo menos R$ 0,03.',
        ]);
        expect(
            transactionFormSchema.safeParse(values(0.47, '48')).error?.issues[0]
                ?.message,
        ).toBe('Em 48 parcelas, o valor precisa ser de pelo menos R$ 0,48.');
        expect(transactionFormSchema.safeParse(values(0.03, '3')).success).toBe(
            true,
        );
        expect(
            transactionFormSchema.safeParse(values(0.48, '48')).success,
        ).toBe(true);
        // Sem parcelar, R$ 0,02 é um lançamento normal.
        expect(
            transactionFormSchema.safeParse({
                ...values(0.02, '3'),
                repeatKind: 'none' as const,
            }).success,
        ).toBe(true);
    });
});
