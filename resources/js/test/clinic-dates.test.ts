import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseDate } from '@/application/clinic/dates';
import { parseDate as parseDateFromHistory } from '@/application/clinic/program-history-filters';

describe('parseDate', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('lê YYYY-MM-DD no fuso local, sem virar o dia anterior em Brasília', () => {
        vi.stubEnv('TZ', 'America/Sao_Paulo');

        const date = parseDate('2026-08-10');

        expect(date?.getFullYear()).toBe(2026);
        expect(date?.getMonth()).toBe(7);
        expect(date?.getDate()).toBe(10);
    });

    it('lê data com hora como instante e devolve null para vazio ou inválido', () => {
        expect(parseDate('2026-08-10T15:00:00Z')?.toISOString()).toBe(
            '2026-08-10T15:00:00.000Z',
        );
        expect(parseDate(null)).toBeNull();
        expect(parseDate('')).toBeNull();
        expect(parseDate('não é data')).toBeNull();
    });

    it('o Histórico usa a mesma função', () => {
        expect(parseDateFromHistory).toBe(parseDate);
    });
});
