import { Info, Play, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/types/exercise';

const difficultyColors: Record<string, string> = {
    facil: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    medio: 'border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-400',
    dificil: 'border-destructive/30 bg-destructive/20 text-destructive',
};

const difficultyLabels: Record<string, string> = {
    facil: 'Fácil',
    medio: 'Médio',
    dificil: 'Difícil',
};

interface ExerciseCardProps {
    exercise: Exercise;
    onPlay?: (exercise: Exercise) => void;
    onToggleFavorite?: (exercise: Exercise) => void;
    onInfo?: (exercise: Exercise) => void;
}

export function ExerciseCard({
    exercise,
    onPlay,
    onToggleFavorite,
    onInfo,
}: ExerciseCardProps) {
    return (
        <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="relative aspect-video overflow-hidden bg-muted">
                <img
                    src={exercise.thumbnailUrl}
                    alt={exercise.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                    type="button"
                    onClick={() => onPlay?.(exercise)}
                    className="absolute inset-0 flex items-center justify-center bg-foreground/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
                        <Play className="ml-1 h-6 w-6 text-primary-foreground" />
                    </div>
                </button>
                <Badge
                    variant="outline"
                    className={cn(
                        'absolute left-2 top-2 text-xs font-medium',
                        difficultyColors[exercise.difficulty],
                    )}
                >
                    {difficultyLabels[exercise.difficulty]}
                </Badge>
            </div>
            <div className="flex-1 p-3">
                <h3 className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">
                    {exercise.title}
                </h3>
            </div>
            <div className="flex items-center justify-end gap-1 px-3 pb-3">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => onToggleFavorite?.(exercise)}
                        >
                            <Star
                                className={cn(
                                    'h-4 w-4',
                                    exercise.isFavorite && 'fill-amber-500 text-amber-500',
                                )}
                            />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {exercise.isFavorite
                            ? 'Remover dos favoritos'
                            : 'Adicionar aos favoritos'}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => onInfo?.(exercise)}
                        >
                            <Info className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver detalhes</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}
