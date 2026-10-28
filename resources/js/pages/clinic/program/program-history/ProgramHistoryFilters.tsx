import { CalendarClock, CircleDot, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';

import {
    STATUS_OPTIONS,
    VALIDITY_LABELS,
    type HistoryFilters,
    type UiStatus,
    type ValidityKey,
} from '@/application/clinic/program-history-filters';
import {
    DsCheckbox,
    DsDatepicker,
    DsDropdown,
    DsRadio,
    DsRadioGroup,
    type DateRange,
} from '@/components/ds';

export interface HistoryFiltersProps {
    filters: HistoryFilters;
    professionals: { id: string; name: string }[];
    onChange: (patch: Partial<HistoryFilters>) => void;
}

function isoToDate(iso: string | null): Date | null {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
    return new Date(y, m - 1, d);
}

function dateToIso(date: Date | null): string | null {
    if (!date) return null;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function CreatedRange({
    filters,
    onChange,
    placeholder,
}: Omit<HistoryFiltersProps, 'professionals'> & { placeholder: string }) {
    const value: DateRange = {
        start: isoToDate(filters.createdFrom),
        end: isoToDate(filters.createdTo),
    };
    return (
        <DsDatepicker
            placeholder={placeholder}
            value={value}
            onValueChange={(v) => {
                const range = v && !(v instanceof Date) ? v : null;
                onChange({
                    createdFrom: dateToIso(range?.start ?? null),
                    createdTo: range?.start ? dateToIso(range.end) : null,
                });
            }}
        />
    );
}

function multiLabel(name: string, selected: string[]): string {
    if (selected.length === 0) return name;
    if (selected.length === 1) return selected[0] as string;
    return `${name} (${selected.length})`;
}

const VALIDITY_ITEMS = [
    { key: 'all', label: 'Qualquer validade' },
    ...(Object.keys(VALIDITY_LABELS) as ValidityKey[]).map((key) => ({
        key,
        label: VALIDITY_LABELS[key],
    })),
];

export function HistoryFiltersBar({
    filters,
    professionals,
    onChange,
}: HistoryFiltersProps) {
    return (
        <>
            <CreatedRange
                filters={filters}
                onChange={onChange}
                placeholder="Criado entre"
            />
            <DsDropdown
                mode="checkbox"
                label="Status"
                icon={<CircleDot />}
                fixedLabel={multiLabel(
                    'Status',
                    STATUS_OPTIONS.filter((o) =>
                        filters.statuses.includes(o.value),
                    ).map((o) => o.label),
                )}
                items={STATUS_OPTIONS.map((o) => ({
                    key: o.value,
                    label: o.label,
                }))}
                value={filters.statuses}
                onValueChange={(v) => onChange({ statuses: v as UiStatus[] })}
            />
            <DsDropdown
                mode="radio"
                label="Validade"
                icon={<CalendarClock />}
                fixedLabel={
                    filters.validity === 'all'
                        ? 'Validade'
                        : VALIDITY_LABELS[filters.validity]
                }
                items={VALIDITY_ITEMS}
                value={filters.validity}
                onValueChange={(v) =>
                    onChange({ validity: v as HistoryFilters['validity'] })
                }
            />
            {professionals.length > 0 && (
                <DsDropdown
                    mode="checkbox"
                    label="Profissional"
                    icon={<UserRound />}
                    menuWidth={260}
                    menuAlign="right"
                    fixedLabel={multiLabel(
                        'Profissional',
                        professionals
                            .filter((p) =>
                                filters.professionalIds.includes(p.id),
                            )
                            .map((p) => p.name),
                    )}
                    items={professionals.map((p) => ({
                        key: p.id,
                        label: p.name,
                    }))}
                    value={filters.professionalIds}
                    onValueChange={(v) =>
                        onChange({ professionalIds: v as string[] })
                    }
                />
            )}
        </>
    );
}

function FacetGroup({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <fieldset className="flex flex-col gap-3 border-b border-ds-border-subtle pb-5 last:border-b-0">
            <legend className="mb-3 text-ds-body-sm font-semibold text-ds-content-primary">
                {title}
            </legend>
            {children}
        </fieldset>
    );
}

function toggle<T>(list: T[], item: T, on: boolean): T[] {
    return on ? [...list, item] : list.filter((x) => x !== item);
}

export function HistoryFiltersPanel({
    filters,
    professionals,
    onChange,
}: HistoryFiltersProps) {
    return (
        <div className="flex flex-col gap-5">
            <FacetGroup title="Criado entre">
                <CreatedRange
                    filters={filters}
                    onChange={onChange}
                    placeholder="Qualquer data"
                />
            </FacetGroup>
            <FacetGroup title="Status">
                {STATUS_OPTIONS.map((o) => (
                    <DsCheckbox
                        key={o.value}
                        label={o.label}
                        checked={filters.statuses.includes(o.value)}
                        onCheckedChange={(on) =>
                            onChange({
                                statuses: toggle(
                                    filters.statuses,
                                    o.value,
                                    on === true,
                                ),
                            })
                        }
                    />
                ))}
            </FacetGroup>
            <FacetGroup title="Validade">
                <DsRadioGroup
                    name="validade"
                    value={filters.validity}
                    onValueChange={(v) =>
                        onChange({ validity: v as HistoryFilters['validity'] })
                    }
                >
                    {VALIDITY_ITEMS.map((i) => (
                        <DsRadio key={i.key} value={i.key} label={i.label} />
                    ))}
                </DsRadioGroup>
            </FacetGroup>
            {professionals.length > 0 && (
                <FacetGroup title="Profissional">
                    {professionals.map((p) => (
                        <DsCheckbox
                            key={p.id}
                            label={p.name}
                            checked={filters.professionalIds.includes(p.id)}
                            onCheckedChange={(on) =>
                                onChange({
                                    professionalIds: toggle(
                                        filters.professionalIds,
                                        p.id,
                                        on === true,
                                    ),
                                })
                            }
                        />
                    ))}
                </FacetGroup>
            )}
        </div>
    );
}
