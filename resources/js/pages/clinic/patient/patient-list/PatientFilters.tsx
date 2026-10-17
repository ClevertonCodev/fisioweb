import { CircleDot, ToggleRight, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';

import type {
    PatientListFilters,
    PatientSituation,
} from '@/application/clinic/patient-list-filters';
import {
    DsCheckbox,
    DsDatepicker,
    DsDropdown,
    DsRadio,
    DsRadioGroup,
    type DateRange,
} from '@/components/ds';
import type { PatientStatus } from '@/domain/clinic/patient';

import { SITUATION_LABELS } from './patient-list-chips';
import { STATUS_OPTIONS } from './patient-status';

export interface PatientFiltersProps {
    filters: PatientListFilters;
    professionals: { id: string; name: string }[];
    onChange: (patch: Partial<PatientListFilters>) => void;
}

const SITUATIONS = Object.keys(SITUATION_LABELS) as PatientSituation[];

/** ISO local (AAAA-MM-DD) ↔ Date à meia-noite local, sem passar por UTC. */
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

function RangeFilter({
    filters,
    onChange,
    placeholder,
}: Omit<PatientFiltersProps, 'professionals'> & { placeholder: string }) {
    const value: DateRange = {
        start: isoToDate(filters.dateFrom),
        end: isoToDate(filters.dateTo),
    };
    return (
        <DsDatepicker
            placeholder={placeholder}
            value={value}
            onValueChange={(v) => {
                const range = v && !(v instanceof Date) ? v : null;
                onChange({
                    dateFrom: dateToIso(range?.start ?? null),
                    dateTo: range?.start ? dateToIso(range.end) : null,
                });
            }}
        />
    );
}

/** Nada marcado: o nome; um: o próprio item; vários: "Nome (n)". */
function multiLabel(name: string, selected: string[]): string {
    if (selected.length === 0) return name;
    if (selected.length === 1) return selected[0] as string;
    return `${name} (${selected.length})`;
}

/** Barra do computador: um dropdown por filtro, ao lado da busca. */
export function PatientFiltersBar({
    filters,
    professionals,
    onChange,
}: PatientFiltersProps) {
    return (
        <>
            <RangeFilter
                filters={filters}
                onChange={onChange}
                placeholder="Cadastrado entre"
            />
            <DsDropdown
                mode="radio"
                label="Situação"
                icon={<ToggleRight />}
                items={SITUATIONS.map((key) => ({
                    key,
                    label: SITUATION_LABELS[key],
                }))}
                value={filters.situation}
                onValueChange={(v) =>
                    onChange({ situation: v as PatientSituation })
                }
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
                onValueChange={(v) =>
                    onChange({ statuses: v as PatientStatus[] })
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

/** Gaveta do celular: os mesmos filtros, em grupos. */
export function PatientFiltersPanel({
    filters,
    professionals,
    onChange,
}: PatientFiltersProps) {
    const allProfessionals =
        professionals.length > 0 &&
        filters.professionalIds.length === professionals.length;

    return (
        <div className="flex flex-col gap-5">
            <FacetGroup title="Cadastrado entre">
                <RangeFilter
                    filters={filters}
                    onChange={onChange}
                    placeholder="Qualquer data"
                />
            </FacetGroup>

            <FacetGroup title="Situação">
                <DsRadioGroup
                    name="situacao"
                    value={filters.situation}
                    onValueChange={(v) =>
                        onChange({ situation: v as PatientSituation })
                    }
                >
                    {SITUATIONS.map((key) => (
                        <DsRadio
                            key={key}
                            value={key}
                            label={SITUATION_LABELS[key]}
                        />
                    ))}
                </DsRadioGroup>
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

            {professionals.length > 0 && (
                <FacetGroup title="Profissional">
                    <DsCheckbox
                        label="Todos"
                        checked={allProfessionals}
                        indeterminate={
                            !allProfessionals &&
                            filters.professionalIds.length > 0
                        }
                        onCheckedChange={() =>
                            onChange({
                                professionalIds: allProfessionals
                                    ? []
                                    : professionals.map((p) => p.id),
                            })
                        }
                    />
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
