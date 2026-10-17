import type { PatientAppointmentHistoryItem } from '@/domain/clinic';

import type { PatientAppointmentHistoryPage } from './ports';

/** Próxima página do histórico; `undefined` na última ou sem acesso (`null`). */
export function nextHistoryPage(
    lastPage: PatientAppointmentHistoryPage | null,
): number | undefined {
    return lastPage && lastPage.currentPage < lastPage.lastPage
        ? lastPage.currentPage + 1
        : undefined;
}

/**
 * Junta as páginas carregadas. A paginação é por offset: se o histórico mudou
 * entre uma página e outra, a mesma consulta pode vir duas vezes.
 */
export function flattenHistoryPages(
    pages: (PatientAppointmentHistoryPage | null)[],
): PatientAppointmentHistoryItem[] {
    const seen = new Set<string>();
    return pages
        .flatMap((page) => page?.items ?? [])
        .filter((item) => !seen.has(item.id) && !!seen.add(item.id));
}
