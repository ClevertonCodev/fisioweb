import type { ProgramWriteDto } from '@/application/clinic/ports';
import type { ProgramExercise, ProgramGroup } from '@/domain/clinic';

export interface ProgramDetailsInput {
    title: string;
    /** Id do paciente, ou vazio para programa sem paciente. */
    patientId: string;
    message: string;
    /** `YYYY-MM-DD`, ou null. */
    startDate: string | null;
    endDate: string | null;
}

/** Ids de grupos e exercícios que já existem no servidor (edição). */
export interface SavedIds {
    groupIds: string[];
    exerciseIds: string[];
}

const toId = (id: string, saved: string[]) =>
    saved.includes(id) ? Number(id) : undefined;

/**
 * O assistente vira o payload de criar ou editar. Sem status: o backend
 * decide a situação (ADR 025). Na edição, o que já estava salvo leva o id,
 * para o backend atualizar no lugar e manter o histórico do paciente.
 */
export function buildProgramWriteDto({
    details,
    groups,
    saved = { groupIds: [], exerciseIds: [] },
    asModel = false,
}: {
    details: ProgramDetailsInput;
    groups: ProgramGroup[];
    saved?: SavedIds;
    asModel?: boolean;
}): ProgramWriteDto {
    return {
        title: details.title.trim(),
        patientId:
            asModel || !details.patientId ? null : Number(details.patientId),
        message: details.message,
        startDate: asModel ? null : details.startDate,
        endDate: asModel ? null : details.endDate,
        groups: groups.map((g, i) => ({
            id: toId(g.id, saved.groupIds),
            name: g.name,
            sortOrder: i,
        })),
        exercises: groups.flatMap((g, groupIndex) =>
            g.exercises.map((e: ProgramExercise) => ({
                id: toId(e.id, saved.exerciseIds),
                exerciseId: Number(e.exerciseId),
                groupIndex,
                days: e.days,
                period: e.period ?? null,
                setsMin: e.seriesMin,
                setsMax: e.seriesMax,
                repetitionsMin: e.repetitionsMin ?? null,
                repetitionsMax: e.repetitionsMax ?? null,
                loadMin: e.loadMin ?? null,
                loadMax: e.loadMax ?? null,
                restTime: e.restTime ?? null,
                notes: e.notes ?? null,
            })),
        ),
    };
}
