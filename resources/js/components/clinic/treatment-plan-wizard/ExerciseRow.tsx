import { Copy, GripVertical, Settings2, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';

import { ExerciseThumb } from './ExerciseThumb';
import { getExerciseSpecs } from './helpers';
import type { ExerciseConfig } from './types';

interface ExerciseRowProps {
    cfg: ExerciseConfig;
    isEditing: boolean;
    isDragging: boolean;
    isDragOver: boolean;
    onEdit: () => void;
    onRemove: () => void;
    onDuplicate: () => void;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
}

export function ExerciseRow({
    cfg,
    isEditing,
    isDragging,
    isDragOver,
    onEdit,
    onRemove,
    onDuplicate,
    onDragStart,
    onDragOver,
    onDrop,
}: ExerciseRowProps) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={() => {}}
            className={cn(
                'flex items-center gap-3 px-4 py-3 transition-colors',
                isDragging && 'opacity-50',
                isDragOver && 'bg-teal-50 dark:bg-teal-950',
                isEditing && 'bg-accent',
            )}
        >
            <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-muted-foreground/50 active:cursor-grabbing" />
            <ExerciseThumb exercise={cfg.exercise} size="sm" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{cfg.exercise.name}</p>
                <p className="text-xs text-muted-foreground">{getExerciseSpecs(cfg)}</p>
            </div>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={onEdit}
                    title="Editar exercício"
                    className={cn(
                        'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors',
                        isEditing
                            ? 'bg-teal-600 text-white'
                            : 'bg-teal-600/10 text-teal-600 hover:bg-teal-600 hover:text-white',
                    )}
                >
                    <Settings2 className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={onDuplicate}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                >
                    <Copy className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
