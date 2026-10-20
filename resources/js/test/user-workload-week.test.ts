import { describe, expect, it } from 'vitest';

import { weekRange } from '@/pages/clinic/user/user-list/use-user-workload';

/** AAAA-MM-DD local, igual ao que o weekRange monta. */
function iso(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

/** A segunda-feira desta semana, a partir de hoje (sem data fixa). */
function thisMonday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
}

describe('weekRange', () => {
    it('vai da segunda até a segunda seguinte, de qualquer dia da semana', () => {
        const monday = thisMonday();
        for (let i = 0; i < 7; i++) {
            const day = addDays(monday, i);
            day.setHours(i === 6 ? 23 : 8, 30);
            expect(weekRange(day)).toEqual({
                from: iso(monday),
                to: iso(addDays(monday, 7)),
            });
        }
    });

    it('domingo à noite ainda é da semana que começou na segunda anterior', () => {
        const sunday = addDays(thisMonday(), 6);
        sunday.setHours(23, 59);
        expect(weekRange(sunday).from).toBe(iso(thisMonday()));
    });
});
