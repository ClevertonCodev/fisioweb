import { Dumbbell, Info, Play } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/types';

const difficultyColors: Record<string, string> = {
    easy: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    medium: 'border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-400',
    hard: 'border-destructive/30 bg-destructive/20 text-destructive',
};

const difficultyLabels: Record<string, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
};

interface ExerciseCardProps {
    exercise: Exercise;
    onPlay?: (exercise: Exercise) => void;
    onInfo?: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, onPlay, onInfo }: ExerciseCardProps) {
    const video = exercise.videos?.[0];
    const thumbnailUrl = video?.thumbnail_url;
    const hasVideo = !!video?.cdn_url;

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="relative aspect-video overflow-hidden bg-muted">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={exercise.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <Dumbbell className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                )}
                {hasVideo && (
                    <button
                        type="button"
                        onClick={() => onPlay?.(exercise)}
                        className="absolute inset-0 flex items-center justify-center bg-foreground/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
                            <Play className="ml-1 h-6 w-6 text-primary-foreground" />
                        </div>
                    </button>
                )}
                <Badge
                    variant="outline"
                    className={cn(
                        'absolute left-2 top-2 text-xs font-medium',
                        difficultyColors[exercise.difficulty_level],
                    )}
                >
                    {difficultyLabels[exercise.difficulty_level] ?? exercise.difficulty_level}
                </Badge>
            </div>
            <div className="flex-1 p-3">
                <h3 className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">
                    {exercise.name}
                </h3>
                {exercise.physio_area && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {exercise.physio_area.name}
                    </p>
                )}
            </div>
            <div className="flex items-center justify-end gap-1 px-3 pb-3">
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
