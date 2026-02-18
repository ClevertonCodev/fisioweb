import { Dialog, DialogContent } from '@/components/ui/dialog';
import { VideoPlayer } from '@/components/video-player';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/types';

const difficultyLabels: Record<string, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
};

const difficultyColors: Record<string, string> = {
    easy: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    medium: 'border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-400',
    hard: 'border-destructive/30 bg-destructive/20 text-destructive',
};

interface ExerciseDescriptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exercise: Exercise | null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    const content = typeof children === 'string' ? children.trim() : children;
    if (content == null || content === '') return null;
    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
        </div>
    );
}

export function ExerciseDescriptionModal({
    open,
    onOpenChange,
    exercise,
}: ExerciseDescriptionModalProps) {
    if (!exercise) return null;

    const video = exercise.videos?.[0];
    const src = video?.cdn_url ?? null;
    const poster = video?.thumbnail_url ?? null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl overflow-hidden border-border bg-card p-0">
                <div className="flex max-h-[85vh] flex-col overflow-y-auto">
                    <div className="h-[320px] w-full shrink-0 overflow-hidden bg-black">
                        {src ? (
                            <VideoPlayer
                                src={src}
                                poster={poster}
                                title={exercise.name}
                                className="h-full w-full"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                Sem vídeo
                            </div>
                        )}
                    </div>
                    <div className="shrink-0 border-b border-border bg-card p-4">
                        <h2 className="text-base font-semibold text-foreground">{exercise.name}</h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {exercise.physio_area && (
                                <span>{exercise.physio_area.name}</span>
                            )}
                            {exercise.body_region && (
                                <>
                                    <span>•</span>
                                    <span>{exercise.body_region.name}</span>
                                </>
                            )}
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-xs',
                                    difficultyColors[exercise.difficulty_level],
                                )}
                            >
                                {difficultyLabels[exercise.difficulty_level] ?? exercise.difficulty_level}
                            </Badge>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 p-5">
                        <h3 className="mb-5 text-lg font-semibold text-foreground">Descrição do exercício</h3>
                        <div className="space-y-6">
                            <Section title="Objetivo terapêutico">
                                {exercise.therapeutic_goal}
                            </Section>
                            <Section title="Descrição">
                                {exercise.description}
                            </Section>
                            <Section title="Indicações">
                                {exercise.indications}
                            </Section>
                            <Section title="Contraindicações">
                                {exercise.contraindications}
                            </Section>
                            {exercise.muscle_group && (
                                <Section title="Grupo muscular">
                                    {exercise.muscle_group}
                                </Section>
                            )}
                            {exercise.frequency && (
                                <Section title="Frequência">
                                    {exercise.frequency}
                                </Section>
                            )}
                            {(exercise.sets != null || exercise.repetitions != null) && (
                                <Section title="Séries e repetições">
                                    {[exercise.sets != null && `Séries: ${exercise.sets}`, exercise.repetitions != null && `Repetições: ${exercise.repetitions}`]
                                        .filter(Boolean)
                                        .join(' • ')}
                                </Section>
                            )}
                            {exercise.clinical_notes && (
                                <Section title="Notas clínicas">
                                    {exercise.clinical_notes}
                                </Section>
                            )}
                        </div>
                        {!exercise.therapeutic_goal &&
                            !exercise.description &&
                            !exercise.indications &&
                            !exercise.contraindications &&
                            !exercise.clinical_notes && (
                                <p className="text-sm text-muted-foreground italic">
                                    Nenhuma descrição disponível para este exercício.
                                </p>
                            )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
