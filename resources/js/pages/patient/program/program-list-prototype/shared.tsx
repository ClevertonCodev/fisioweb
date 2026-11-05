import { Activity, Loader2 } from 'lucide-react';

import { DsBadge, DsEmptyState } from '@/components/ds';
import type { PatientProgram } from '@/domain/patient/program';

export type ProgramListViewProps = {
    clinicSlug: string;
    programs: PatientProgram[] | undefined;
    isLoading: boolean;
    isRefetching: boolean;
    onRefresh: () => void;
    onOpenProgram: (publicToken: string) => void;
};

export function totalExercises(program: PatientProgram): number {
    return (
        program.exerciseCount ??
        program.groups.reduce((acc, g) => acc + g.exercises.length, 0)
    );
}

export function programSlug(
    clinicSlug: string,
    program: PatientProgram,
): string {
    return clinicSlug || program.clinicSlug || '';
}

export function formatProgramPeriod(program: PatientProgram): string {
    const fmt = (d?: string) =>
        d ? new Date(d).toLocaleDateString('pt-BR') : '—';
    return `${fmt(program.startDate)} a ${fmt(program.endDate)}`;
}

export function PatientProgramStatusBadge({
    status,
}: {
    status: PatientProgram['status'];
}) {
    switch (status) {
        case 'available':
            return (
                <DsBadge variant="primary" className="shrink-0">
                    Disponível
                </DsBadge>
            );
        case 'scheduled':
            return (
                <DsBadge variant="warning" className="shrink-0">
                    Disponível em breve
                </DsBadge>
            );
        case 'unavailable':
            return (
                <DsBadge variant="default" className="shrink-0">
                    Indisponível
                </DsBadge>
            );
        case 'completed':
            return (
                <DsBadge variant="success" className="shrink-0">
                    Concluído
                </DsBadge>
            );
        case 'inactive':
            return (
                <DsBadge variant="default" className="shrink-0">
                    Inativo
                </DsBadge>
            );
        default:
            return null;
    }
}

export function ProgramListLoading() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-ds-content-muted">
            <Loader2 className="mb-4 size-8 animate-spin text-ds-content-brand" />
            <p className="text-ds-body-xs">Carregando programas. Aguarde…</p>
        </div>
    );
}

export function ProgramListEmpty() {
    return (
        <DsEmptyState
            variant="empty"
            icon={<Activity />}
            title="Nenhum programa disponível"
            description="Entre em contato com o profissional da saúde."
            className="py-8"
        />
    );
}
