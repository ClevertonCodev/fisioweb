import { ToggleRight, UserCog } from 'lucide-react';
import type { ReactNode } from 'react';

import type {
    UserListFilters,
    UserListStatus,
} from '@/application/clinic/user-list-filters';
import { DsCheckbox, DsDropdown, DsRadio, DsRadioGroup } from '@/components/ds';
import type { ClinicRole } from '@/domain/auth/session';

import { ROLE_META, ROLES } from './roles';
import { STATUS_LABELS } from './user-list-chips';

interface UserFiltersProps {
    filters: UserListFilters;
    onChange: (patch: Partial<UserListFilters>) => void;
}

const STATUSES = Object.keys(STATUS_LABELS) as UserListStatus[];

/** Nada marcado: o nome; um: o próprio item; vários: "Nome (n)". */
function multiLabel(name: string, selected: string[]): string {
    if (selected.length === 0) return name;
    if (selected.length === 1) return selected[0] as string;
    return `${name} (${selected.length})`;
}

/** Barra do computador: um dropdown por filtro, ao lado da busca. */
export function UserFiltersBar({ filters, onChange }: UserFiltersProps) {
    return (
        <>
            <DsDropdown
                mode="checkbox"
                label="Função"
                icon={<UserCog />}
                menuWidth={220}
                fixedLabel={multiLabel(
                    'Função',
                    filters.roles.map((r) => ROLE_META[r].label),
                )}
                items={ROLES.map((r) => ({
                    key: r,
                    label: ROLE_META[r].label,
                }))}
                value={filters.roles}
                onValueChange={(v) => onChange({ roles: v as ClinicRole[] })}
            />
            <DsDropdown
                mode="radio"
                label="Status"
                icon={<ToggleRight />}
                menuAlign="right"
                items={STATUSES.map((key) => ({
                    key,
                    label: STATUS_LABELS[key],
                }))}
                value={filters.status}
                onValueChange={(v) => onChange({ status: v as UserListStatus })}
            />
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

/** Gaveta do celular: os mesmos filtros, em grupos. */
export function UserFiltersPanel({ filters, onChange }: UserFiltersProps) {
    return (
        <div className="flex flex-col gap-5">
            <FacetGroup title="Função">
                {ROLES.map((role) => (
                    <DsCheckbox
                        key={role}
                        label={ROLE_META[role].label}
                        checked={filters.roles.includes(role)}
                        onCheckedChange={(on) =>
                            onChange({
                                roles:
                                    on === true
                                        ? [...filters.roles, role]
                                        : filters.roles.filter(
                                              (r) => r !== role,
                                          ),
                            })
                        }
                    />
                ))}
            </FacetGroup>
            <FacetGroup title="Status">
                <DsRadioGroup
                    name="status"
                    value={filters.status}
                    onValueChange={(v) =>
                        onChange({ status: v as UserListStatus })
                    }
                >
                    {STATUSES.map((key) => (
                        <DsRadio
                            key={key}
                            value={key}
                            label={STATUS_LABELS[key]}
                        />
                    ))}
                </DsRadioGroup>
            </FacetGroup>
        </div>
    );
}
