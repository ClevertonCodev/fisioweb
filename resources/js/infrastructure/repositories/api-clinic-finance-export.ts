import { apiClient } from '@/infrastructure/api/client';

export interface FinanceExportParams {
    format: 'csv' | 'xlsx' | 'pdf';
    range: 'current_month' | 'previous_month' | 'custom';
    from?: string;
    to?: string;
}

export const apiClinicFinanceExportRepository = {
    async export(params: FinanceExportParams): Promise<void> {
        const response = await apiClient.get('/clinic/finances/export', {
            params,
            responseType: 'blob',
        });

        const disposition = response.headers['content-disposition'] as
            | string
            | undefined;
        const filenameMatch = disposition?.match(/filename="?([^";]+)"?/);
        const filename = filenameMatch?.[1] ?? `financas.${params.format}`;

        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    },
};
