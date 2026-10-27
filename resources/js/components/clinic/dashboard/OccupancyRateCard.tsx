import { useMemo, useState } from 'react';

import { useClinicUsers } from '@/application/clinic/use-appointments';
import { useOccupancyRate } from '@/application/clinic/use-dashboard';
import {
    DsCard,
    DsEmptyState,
    DsSelect,
    DsTabs,
    DsTooltip,
} from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type {
    OccupancyBucket,
    OccupancyGranularity,
} from '@/domain/clinic/dashboard';

import { OCCUPANCY_GRANULARITIES } from './dashboard-format';

export function OccupancyRateCard({
    canChooseProfessional,
}: {
    canChooseProfessional: boolean;
}) {
    const { user } = useAuth();
    const [granularity, setGranularity] =
        useState<OccupancyGranularity>('daily');
    const [chosenUserId, setChosenUserId] = useState<string | undefined>();
    const { data: professionals = [] } = useClinicUsers();

    // Derivado, não copiado: a sessão pode hidratar depois do primeiro render.
    const selectedUserId =
        chosenUserId ??
        (canChooseProfessional && user ? String(user.id) : undefined);

    const occupancy = useOccupancyRate(granularity, selectedUserId);
    const occupancyPercent = occupancy.data
        ? Math.round(occupancy.data.occupiedRate * 100)
        : 0;

    const options = useMemo(() => {
        const list = professionals.map((person) => ({
            value: person.id,
            label: person.name,
        }));
        if (user && !list.some((item) => item.value === String(user.id))) {
            list.unshift({
                value: String(user.id),
                label: `${user.name} (eu)`,
            });
        }
        return list;
    }, [professionals, user]);

    return (
        <DsCard
            header={
                <>
                    <h3>Taxa de ocupação</h3>
                    <p>{occupancyPercent}% do tempo agendado</p>
                </>
            }
            corner={
                canChooseProfessional && options.length > 0 ? (
                    <DsSelect
                        size="sm"
                        aria-label="Profissional"
                        value={selectedUserId}
                        options={options}
                        onValueChange={(value) =>
                            setChosenUserId(
                                Array.isArray(value) ? value[0] : value,
                            )
                        }
                    />
                ) : undefined
            }
        >
            <DsTabs
                size="sm"
                aria-label="Granularidade da ocupação"
                value={granularity}
                onValueChange={(key) =>
                    setGranularity(key as OccupancyGranularity)
                }
                tabs={OCCUPANCY_GRANULARITIES.map((item) => ({
                    key: item.value,
                    label: item.label,
                }))}
            />
            {occupancy.isError ? (
                <DsEmptyState variant="error" title="Ocupação" />
            ) : occupancy.isLoading ? (
                <p className="pt-4">Carregando…</p>
            ) : (
                <OccupancyColumns buckets={occupancy.data?.buckets ?? []} />
            )}
        </DsCard>
    );
}

const MAX_LABELED_BUCKETS = 12;

function OccupancyColumns({ buckets }: { buckets: OccupancyBucket[] }) {
    const showPercentLabels = buckets.length <= MAX_LABELED_BUCKETS;

    return (
        <div className="flex h-48 items-end gap-1 pt-4 sm:gap-2">
            {buckets.map((bucket) => {
                const percent = Math.round(bucket.rate * 100);
                const barHeight =
                    percent === 0 ? 0 : Math.min(Math.max(percent, 8), 100);
                const tooltip = `${bucket.label} · ${percent}% ocupado`;

                return (
                    <DsTooltip
                        key={bucket.label}
                        placement="top"
                        asChild
                        content={tooltip}
                    >
                        <button
                            type="button"
                            aria-label={tooltip}
                            className="flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1"
                        >
                            {showPercentLabels ? (
                                <span className="min-h-[1em] text-ds-caption leading-none font-medium text-ds-content-primary">
                                    {percent > 0 ? `${percent}%` : '\u00a0'}
                                </span>
                            ) : null}
                            <span className="flex h-28 w-full items-end rounded-ds-sm bg-ds-surface-subtle">
                                <span
                                    className="block w-full rounded-ds-sm bg-ds-primary-80 ds-dark:bg-ds-primary-70"
                                    style={{ height: `${barHeight}%` }}
                                />
                            </span>
                            <span className="truncate text-ds-caption text-ds-content-muted">
                                {bucket.label}
                            </span>
                        </button>
                    </DsTooltip>
                );
            })}
        </div>
    );
}
