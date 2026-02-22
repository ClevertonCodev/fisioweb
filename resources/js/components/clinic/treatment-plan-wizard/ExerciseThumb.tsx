import { Dumbbell, Play } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Exercise } from '@/types';

import { getExerciseThumbnail } from './helpers';

export function ExerciseThumb({ exercise, size = 'md' }: { exercise: Exercise; size?: 'sm' | 'md' }) {
    const thumb = getExerciseThumbnail(exercise);
    const sizeClass = size === 'sm' ? 'h-12 w-16' : 'h-16 w-20';
    return (
        <div className={cn('relative flex-shrink-0 overflow-hidden rounded-md bg-teal-600', sizeClass)}>
            {thumb ? (
                <img src={thumb} alt={exercise.name} className="h-full w-full object-cover" />
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-white/60" />
                </div>
            )}
            {exercise.videos?.[0]?.cdn_url && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80">
                        <Play className="ml-0.5 h-3 w-3 text-teal-700" />
                    </div>
                </div>
            )}
        </div>
    );
}
