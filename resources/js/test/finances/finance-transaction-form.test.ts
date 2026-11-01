import { describe, expect, it } from 'vitest';

import {
    feeInReais,
    switchFeeMode,
    transactionFormDefaults,
} from '@/application/clinic/finance-transaction-form';

describe('taxa da maquininha', () => {
    it('em %, vira reais arredondados em centavos', () => {
        expect(feeInReais(100, 'percent', 3)).toBe(3);
        expect(feeInReais(99.99, 'percent', 2.5)).toBe(2.5);
        expect(feeInReais(10, 'percent', 3.33)).toBe(0.33);
    });

    it('em R$, é o próprio valor', () => {
        expect(feeInReais(100, 'money', 4.5)).toBe(4.5);
    });

    it('sem valor ou sem taxa, é zero', () => {
        expect(feeInReais(null, 'percent', 3)).toBe(0);
        expect(feeInReais(100, 'percent', null)).toBe(0);
    });
});

describe('trocar a taxa entre R$ e %', () => {
    const base = transactionFormDefaults('entrada');

    it('de R$ para %, mostra a porcentagem equivalente', () => {
        expect(
            switchFeeMode({ ...base, amount: 200, feeAmount: 5 }, 'percent'),
        ).toEqual({ feeMode: 'percent', feeAmount: 5, feePercent: '2,5' });
    });

    it('de % para R$, leva os reais arredondados', () => {
        expect(
            switchFeeMode(
                { ...base, amount: 100, feeMode: 'percent', feePercent: '3' },
                'money',
            ),
        ).toEqual({ feeMode: 'money', feeAmount: 3, feePercent: '3' });
    });

    it('sem valor ou sem taxa, deixa o campo vazio', () => {
        expect(switchFeeMode(base, 'percent')).toEqual({
            feeMode: 'percent',
            feeAmount: null,
            feePercent: '',
        });
    });
});
