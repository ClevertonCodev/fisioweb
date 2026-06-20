import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { FinanceListParams } from '@/domain/clinic/finance';
import {
    apiClinicFinanceExportRepository,
    type FinanceExportParams,
} from '@/infrastructure/repositories/api-clinic-finance-export';

export function useFinanceExport() {
    return useMutation({
        mutationFn: (params: FinanceExportParams) =>
            apiClinicFinanceExportRepository.export(params),
        onSuccess: () => toast.success('Exportação iniciada.'),
        onError: () =>
            toast.error('Não foi possível exportar. Verifique o intervalo.'),
    });
}

export type { FinanceExportParams };
