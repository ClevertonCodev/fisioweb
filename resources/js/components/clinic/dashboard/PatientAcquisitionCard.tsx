import { usePatientAcquisition } from '@/application/clinic/use-dashboard';
import { DsCard, DsEmptyState } from '@/components/ds';
import type { DashboardScope } from '@/domain/clinic/dashboard';

import { sourceLabel } from './dashboard-format';

export function PatientAcquisitionCard({ scope }: { scope: DashboardScope }) {
    const acquisition = usePatientAcquisition(scope);

    return (
        <DsCard
            header={
                <>
                    <h3>Captação de pacientes</h3>
                    <p>Comparação por origem nos últimos 3 anos</p>
                </>
            }
        >
            {acquisition.isError ? (
                <DsEmptyState variant="error" title="Captação" />
            ) : acquisition.isLoading || !acquisition.data ? (
                <p>Carregando…</p>
            ) : acquisition.data.sources.length === 0 ? (
                <DsEmptyState
                    variant="empty"
                    title="Sem pacientes captados no período"
                />
            ) : (
                <ul
                    aria-label="Captação por origem"
                    className="m-0 flex list-none flex-col gap-4 p-0"
                >
                    {acquisition.data.sources.map((item) => (
                        <li key={item.source}>
                            <div className="mb-1 flex justify-between text-ds-caption">
                                <span className="font-medium text-ds-content-primary">
                                    {sourceLabel(item.source)}
                                </span>
                                <span className="text-ds-content-muted">
                                    {item.total} · {item.percentTotal}%
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-ds-pill bg-ds-surface-subtle">
                                <div
                                    className="h-full rounded-ds-pill bg-ds-primary-80 ds-dark:bg-ds-primary-70"
                                    style={{
                                        width: `${Math.max(item.percentTotal, 2)}%`,
                                    }}
                                />
                            </div>
                            <dl className="mt-2 grid grid-cols-3 gap-2">
                                {acquisition.data.years.map((year) => (
                                    <div key={year}>
                                        <dt className="text-ds-caption text-ds-content-muted">
                                            {year}
                                        </dt>
                                        <dd className="m-0 text-ds-body-xs font-medium text-ds-content-primary">
                                            {item.perYear[String(year)] ?? 0}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </li>
                    ))}
                </ul>
            )}
        </DsCard>
    );
}
