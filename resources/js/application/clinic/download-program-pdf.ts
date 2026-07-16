import { toast } from 'sonner';

import { apiClinicProgramsRepository } from '@/infrastructure/repositories/api-clinic-programs';

/** Abre o PDF do programa em nova aba (Bearer via apiClient). */
export async function downloadProgramPdf(id: string): Promise<void> {
    try {
        const blob = await apiClinicProgramsRepository.fetchPdfBlob(id);
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        if (!win) {
            URL.revokeObjectURL(url);
            toast.error('Permita pop-ups para abrir o PDF.');
            return;
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    } catch {
        toast.error('Erro ao abrir PDF do programa.');
    }
}
