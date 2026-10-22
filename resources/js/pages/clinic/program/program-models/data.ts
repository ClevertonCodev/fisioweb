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
    listClinicProgramsLibraryPaginated,
    useClinicProgramLibraryDetail,
} from '@/application/clinic/use-clinic-programs-library';
import {
    listMyModelsPaginated,
    useClinicProgram,
} from '@/application/clinic/use-programs';

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
        queryFn: () => listClinicProgramsLibraryPaginated({ perPage: 200 }),
        enabled: origin === 'nossos',
    });
    const mine = useQuery({
        queryKey: ['clinic-programs', 'my-models-all'],
        queryFn: () => listMyModelsPaginated({ perPage: 200 }),
        enabled: origin === 'meus',
    });
    const models: ModelSummary[] =
        origin === 'nossos'
            ? (library.data?.data ?? []).map(fromLibrary)
            : (mine.data?.items ?? []).map(fromMine);
    return {
        models,
        isLoading: origin === 'nossos' ? library.isLoading : mine.isLoading,
        isError: origin === 'nossos' ? library.isError : mine.isError,
    };
}

export function useModelDetail(model: ModelSummary | null): {
    detail: ModelDetail | null;
    isLoading: boolean;
} {
    const lib = useClinicProgramLibraryDetail(
        model?.origin === 'nossos' ? Number(model.id) : null,
    );
    const mine = useClinicProgram(
        model?.origin === 'meus' ? model.id : undefined,
    );
    if (!model) return { detail: null, isLoading: false };
    if (model.origin === 'nossos') {
        const p = lib.data;
        return {
            isLoading: lib.isLoading,
            detail: p
                ? {
                      ...model,
                      ...fromLibrary(p),
                      groups: (p.groups ?? []).map((g) => ({
                          id: String(g.id),
                          name: g.name,
                          exercises: (g.exercises ?? []).map(libraryExercise),
                      })),
                      source: p,
                  }
                : null,
        };
    }
    const p = mine.data;
    return {
        isLoading: mine.isLoading,
        detail: p
            ? {
                  ...model,
                  ...fromMine(p),
                  groups: p.groups.map((g) => ({
                      id: g.id,
                      name: g.name,
                      exercises: g.exercises.map(myExercise),
                  })),
                  source: p,
              }
            : null,
    };
}
