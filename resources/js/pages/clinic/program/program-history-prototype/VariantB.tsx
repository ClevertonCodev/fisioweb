/** PROTÓTIPO B: tabela densa (DsTable), para quem varre muitos programas. */
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

import { DsTable, type TableAction, type TableColumn } from '@/components/ds';
import type { Program } from '@/domain/clinic';

import {
    exerciseCountLabel,
    formatLong,
    PersonAvatar,
    PROGRAM_ACTIONS,
    programPath,
    ProgramStatusBadge,
    ValidityBar,
    type VariantProps,
} from './shared';

const COLUMNS: TableColumn<Program>[] = [
    { key: 'patient', label: 'Paciente', width: '22%' },
    { key: 'program', label: 'Programa', width: '26%' },
    { key: 'professional', label: 'Profissional' },
    { key: 'validity', label: 'Validade', width: '20%' },
    { key: 'status', label: 'Status' },
];

export function VariantB({ programs, onAction }: VariantProps) {
    const actions: TableAction<Program>[] = [
        {
            key: 'open',
            label: 'Abrir programa',
            icon: <Eye />,
            href: programPath,
            handler: () => {},
        },
        ...PROGRAM_ACTIONS.map(
            (a): TableAction<Program> => ({
                key: a.key,
                label: a.label,
                icon: a.icon,
                variant: a.danger ? 'danger' : 'default',
                visible: a.visible,
                handler: (row) => onAction(a.key, row),
            }),
        ),
    ];

    return (
        <DsTable<Program>
            columns={COLUMNS}
            rows={programs}
            actions={actions}
            emptyLabel="Nenhum programa"
            cells={{
                patient: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <PersonAvatar
                            name={row.patientName}
                            photoUrl={row.patientPhotoUrl}
                            size={36}
                        />
                        <div className="min-w-0">
                            <Link
                                to={programPath(row)}
                                className="block truncate font-medium text-ds-content-primary hover:text-ds-content-brand hover:underline ds-dark:hover:text-ds-primary-60"
                            >
                                {row.patientName ?? '(sem paciente)'}
                            </Link>
                            <p className="text-ds-caption text-ds-content-muted">
                                criado em {formatLong(row.createdAt)}
                            </p>
                        </div>
                    </div>
                ),
                program: ({ row }) => (
                    <div className="min-w-0">
                        <p className="truncate font-medium text-ds-content-primary">
                            {row.title}
                        </p>
                        <p className="text-ds-caption text-ds-content-muted">
                            {exerciseCountLabel(row.exerciseCount)}
                        </p>
                    </div>
                ),
                professional: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <PersonAvatar
                            name={row.professionalName}
                            photoUrl={row.professionalPhotoUrl}
                            size={28}
                        />
                        <span className="truncate text-ds-content-secondary">
                            {row.professionalName ?? '—'}
                        </span>
                    </div>
                ),
                validity: ({ row }) => (
                    <div className="min-w-44">
                        <ValidityBar program={row} compact />
                    </div>
                ),
                status: ({ row }) => <ProgramStatusBadge program={row} />,
            }}
        />
    );
}
