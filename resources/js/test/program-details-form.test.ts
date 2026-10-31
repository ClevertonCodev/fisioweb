import { describe, expect, it } from 'vitest';

import {
    programDetailsSchema,
    startOfToday,
} from '@/application/clinic/program-details-form';

const DAY = 86_400_000;
const base = { title: 'Joelho', patientId: '', endDate: null, message: '' };
const daysFromToday = (n: number) =>
    new Date(startOfToday().getTime() + n * DAY);

describe('programDetailsSchema: datas', () => {
    it('no novo, início antes de hoje é recusado', () => {
        const r = programDetailsSchema(null).safeParse({
            ...base,
            startDate: daysFromToday(-1),
        });
        expect(r.success).toBe(false);
        expect(r.error?.issues[0]?.path).toEqual(['startDate']);
    });

    it('na edição, o início que já passou pode ficar, mas não vira outra data passada', () => {
        const kept = daysFromToday(-30);
        const schema = programDetailsSchema(kept);

        expect(schema.safeParse({ ...base, startDate: kept }).success).toBe(
            true,
        );
        expect(
            schema.safeParse({ ...base, startDate: daysFromToday(-10) })
                .success,
        ).toBe(false);
        expect(
            schema.safeParse({ ...base, startDate: daysFromToday(2) }).success,
        ).toBe(true);
    });

    it('término antes do início é recusado', () => {
        const r = programDetailsSchema(null).safeParse({
            ...base,
            startDate: daysFromToday(5),
            endDate: daysFromToday(2),
        });
        expect(r.success).toBe(false);
        expect(r.error?.issues[0]?.path).toEqual(['endDate']);
    });
});
