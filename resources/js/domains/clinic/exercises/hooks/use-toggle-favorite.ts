import { useCallback } from 'react';

import { http } from '@/lib/http';
import type { Exercise } from '@/types';

export function useToggleFavorite(
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>,
) {
    return useCallback(
        async (exercise: Exercise) => {
            setExercises((prev) =>
                prev.map((ex) =>
                    ex.id === exercise.id ? { ...ex, is_favorite: !ex.is_favorite } : ex,
                ),
            );

            try {
                const { data } = await http.post<{ is_favorite: boolean }>(
                    `/clinic/exercises/${exercise.id}/toggle-favorite`,
                );
                setExercises((prev) =>
                    prev.map((ex) =>
                        ex.id === exercise.id ? { ...ex, is_favorite: data.is_favorite } : ex,
                    ),
                );
            } catch {
                setExercises((prev) =>
                    prev.map((ex) =>
                        ex.id === exercise.id ? { ...ex, is_favorite: !ex.is_favorite } : ex,
                    ),
                );
            }
        },
        [setExercises],
    );
}
