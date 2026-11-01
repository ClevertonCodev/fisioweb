import type { FinanceCalendarMonth } from '@/domain/clinic/finance';
import { apiClient } from '@/infrastructure/api/client';

interface ApiCalendarMonth {
    period: string;
    days: {
        date: string;
        income: number | string;
        expense: number | string;
    }[];
}

export const apiClinicFinanceCalendarRepository = {
    async getMonth(period: string): Promise<FinanceCalendarMonth> {
        const { data } = await apiClient.get<{ data: ApiCalendarMonth }>(
            '/clinic/finances/calendar',
            { params: { period } },
        );
        return {
            period: data.data.period,
            days: data.data.days.map((day) => ({
                date: day.date,
                income: Number(day.income),
                expense: Number(day.expense),
            })),
        };
    },
};
