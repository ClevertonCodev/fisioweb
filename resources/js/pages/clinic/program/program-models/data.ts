import { useQuery } from '@tanstack/react-query';

import {
    fromLibrary,
    fromMine,
    libraryExercise,
    myExercise,
    type ModelDetail,
    type ModelSummary,
    type Origin,
} from '@/application/clinic/program-models';
import {
    listAllClinicProgramsLibrary,
    useClinicProgramLibraryDetail,
    useFetchClinicProgramLibraryDetail,
} from '@/application/clinic/use-clinic-programs-library';
import {
    listAllClinicPrograms,
    useClinicProgram,
    useFetchClinicProgram,
} from '@/application/clinic/use-programs';
import type { AdminProgram } from '@/domain/admin';
import type { Program } from '@/domain/clinic';

export {
    activeModelFilterCount as activeFilterCount,
    applyModelFilters as applyFilters,
    areaOptions,
    modelChips as chipsOf,
    doseOf,
    exercisesOf,
    formatDate,
    fromLibrary,
    fromMine,
    INITIAL_MODEL_FILTERS as INITIAL_FILTERS,
    libraryExercise,
    myExercise,
    REGIONS,
    regionsOf,
    removeModelChip as removeChip,
    scheduleOf,
    type ModelDetail,
    type ModelExercise,
    type ModelFilters,
    type ModelGroup,
    type ModelSummary,
    type Origin,
    type Region,
} from '@/application/clinic/program-models';

export function useModels(origin: Origin) {
    const library = useQuery({
        queryKey: ['clinic', 'programs-library', 'all'],
        queryFn: () => listAllClinicProgramsLibrary(),
        enabled: origin === 'nossos',
    });
    const mine = useQuery({
        queryKey: ['clinic-programs', 'all', { withoutPatient: true }],
        queryFn: () => listAllClinicPrograms({ withoutPatient: true }),
        enabled: origin === 'meus',
    });
    const models: ModelSummary[] =
        origin === 'nossos'
            ? (library.data ?? []).map(fromLibrary)
            : (mine.data ?? []).map(fromMine);
    return {
        models,
        isLoading: origin === 'nossos' ? library.isLoading : mine.isLoading,
        isError: origin === 'nossos' ? library.isError : mine.isError,
    };
}

function libraryDetail(model: ModelSummary, p: AdminProgram): ModelDetail {
    return {
        ...model,
        ...fromLibrary(p),
        groups: (p.groups ?? []).map((g) => ({
            id: String(g.id),
            name: g.name,
            exercises: (g.exercises ?? []).map(libraryExercise),
        })),
        source: p,
    };
}

function mineDetail(model: ModelSummary, p: Program): ModelDetail {
    return {
        ...model,
        ...fromMine(p),
        groups: p.groups.map((g) => ({
            id: g.id,
            name: g.name,
            exercises: g.exercises.map(myExercise),
        })),
        source: p,
    };
}

export function useModelDetail(
    model: ModelSummary | null,
    enabled = true,
): {
    detail: ModelDetail | null;
    isLoading: boolean;
    isError: boolean;
} {
    const lib = useClinicProgramLibraryDetail(
        model?.origin === 'nossos' ? Number(model.id) : null,
        enabled,
    );
    const mine = useClinicProgram(
        model?.origin === 'meus' ? model.id : undefined,
        enabled,
    );
    if (!model) return { detail: null, isLoading: false, isError: false };
    const query = model.origin === 'nossos' ? lib : mine;
    const detail =
        model.origin === 'nossos'
            ? lib.data
                ? libraryDetail(model, lib.data)
                : null
            : mine.data
              ? mineDetail(model, mine.data)
              : null;
    return { detail, isLoading: query.isLoading, isError: query.isError };
}

export function useFetchModelDetail() {
    const fetchLibrary = useFetchClinicProgramLibraryDetail();
    const fetchMine = useFetchClinicProgram();
    return async (model: ModelSummary): Promise<ModelDetail | null> => {
        if (model.origin === 'nossos') {
            return libraryDetail(model, await fetchLibrary(Number(model.id)));
        }
        const p = await fetchMine(model.id);
        return p ? mineDetail(model, p) : null;
    };
}
