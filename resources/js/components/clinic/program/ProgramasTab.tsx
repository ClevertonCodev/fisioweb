import {
    Calendar,
    Clock,
    Dumbbell,
    Maximize,
    Pause,
    Play,
    Search,
    User,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    useClinicProgramLibraryDetail,
    useInfiniteClinicProgramsLibrary,
} from '@/application/clinic/use-clinic-programs-library';
import {
    useClinicProgram,
    useInfiniteMyPrograms,
} from '@/application/clinic/use-programs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AdminProgramExercise } from '@/domain/admin';
import type { ProgramExercise } from '@/domain/clinic';
import { cn } from '@/lib/utils';

interface ExerciseRowProps {
    exercise: {
        id: number;
        name: string;
        thumbnailUrl: string | null;
        videoUrl: string | null;
    };
    frequency: string;
}

function ExerciseRow({ exercise, frequency }: ExerciseRowProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(false);

    const togglePlay = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!videoRef.current) return;
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        },
        [isPlaying],
    );

    const handleFullscreen = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        videoRef.current?.requestFullscreen?.();
    }, []);

    return (
        <div className="flex items-center gap-4 py-3">
            <div
                className="group relative h-[100px] w-[180px] flex-shrink-0 cursor-pointer overflow-hidden rounded-lg"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
            >
                <video
                    ref={videoRef}
                    src={exercise.videoUrl ?? undefined}
                    poster={exercise.thumbnailUrl ?? undefined}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                    onEnded={() => setIsPlaying(false)}
                />
                {!isPlaying && (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-black/20"
                        onClick={togglePlay}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50">
                            <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                        </div>
                    </div>
                )}
                {isPlaying && showControls && (
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                        <button
                            onClick={togglePlay}
                            className="text-white hover:text-white/80"
                        >
                            <Pause className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleFullscreen}
                            className="text-white hover:text-white/80"
                        >
                            <Maximize className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            <p className="min-w-0 flex-1 font-medium text-foreground">
                {exercise.name}
            </p>

            <p className="max-w-[400px] flex-shrink-0 text-sm text-primary">
                {frequency}
            </p>
        </div>
    );
}

function buildFrequency(ex: AdminProgramExercise) {
    const parts: string[] = [];

    if (ex.daysOfWeek?.length) {
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        parts.push(ex.daysOfWeek.map((d) => dayNames[d]).join('/'));
    }

    const sets =
        ex.setsMin != null && ex.setsMax != null && ex.setsMin !== ex.setsMax
            ? `${ex.setsMin}-${ex.setsMax} séries`
            : ex.setsMin != null
              ? `${ex.setsMin} séries`
              : null;
    if (sets) parts.push(sets);

    const reps =
        ex.repetitionsMin != null &&
        ex.repetitionsMax != null &&
        ex.repetitionsMin !== ex.repetitionsMax
            ? `${ex.repetitionsMin}-${ex.repetitionsMax} repetições`
            : ex.repetitionsMin != null
              ? `${ex.repetitionsMin} repetições`
              : null;
    if (reps) parts.push(reps);

    if (ex.restTime != null) parts.push(`descansar por ${ex.restTime} seg`);

    return parts.length > 0 ? `Frequência: ${parts.join(', ')}` : '—';
}

function ProgramDetail({ id }: { id: number }) {
    const navigate = useNavigate();
    const { data: program, isLoading } = useClinicProgramLibraryDetail(id);

    if (isLoading) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (!program) return null;

    const totalExercises =
        program.groups?.reduce(
            (acc, g) => acc + (g.exercises?.length ?? 0),
            0,
        ) ??
        program.exercisesCount ??
        0;

    return (
        <div className="p-6">
            <div className="mb-6 rounded-lg border border-border p-6">
                <h2 className="mb-3 text-xl font-semibold text-foreground">
                    {program.title}
                </h2>
                <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary">
                    Modelo
                </Badge>

                <div className="flex flex-wrap items-center gap-8 text-sm text-muted-foreground">
                    {program.createdBy && (
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Criado por
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                    {program.createdBy.name}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Dumbbell className="h-4 w-4" />
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Exercícios
                            </p>
                            <p className="text-sm font-medium text-foreground">
                                {totalExercises} exercícios
                            </p>
                        </div>
                    </div>
                    {program.durationMinutes && (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Duração
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                    {program.durationMinutes} min.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {program.groups?.map((group) => (
                <div key={group.id} className="mb-6">
                    <div className="mb-4 flex items-center gap-2">
                        <h3 className="text-base font-medium text-foreground">
                            {group.name}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                            {group.exercises?.length ?? 0}
                        </span>
                    </div>

                    {group.exercises && group.exercises.length > 0 ? (
                        <div className="divide-y divide-border">
                            {group.exercises.map((ex) =>
                                ex.exercise ? (
                                    <ExerciseRow
                                        key={ex.id}
                                        exercise={ex.exercise}
                                        frequency={buildFrequency(ex)}
                                    />
                                ) : null,
                            )}
                        </div>
                    ) : (
                        <p className="py-4 text-sm text-muted-foreground">
                            Nenhum exercício neste grupo
                        </p>
                    )}
                </div>
            ))}

            <div className="fixed right-6 bottom-6">
                <Button
                    size="lg"
                    className="shadow-lg"
                    onClick={() =>
                        navigate('/clinica/programas/novo', {
                            state: { program },
                        })
                    }
                >
                    Criar programa
                </Button>
            </div>
        </div>
    );
}

function buildMyFrequency(ex: ProgramExercise) {
    const parts: string[] = [];

    if (ex.days?.length) {
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        parts.push(ex.days.map((d) => dayNames[d]).join('/'));
    }

    const sets =
        ex.seriesMin != null &&
        ex.seriesMax != null &&
        ex.seriesMin !== ex.seriesMax
            ? `${ex.seriesMin}-${ex.seriesMax} séries`
            : ex.seriesMin != null
              ? `${ex.seriesMin} séries`
              : null;
    if (sets) parts.push(sets);

    const reps =
        ex.repetitionsMin != null &&
        ex.repetitionsMax != null &&
        ex.repetitionsMin !== ex.repetitionsMax
            ? `${ex.repetitionsMin}-${ex.repetitionsMax} repetições`
            : ex.repetitionsMin != null
              ? `${ex.repetitionsMin} repetições`
              : null;
    if (reps) parts.push(reps);

    if (ex.restTime != null) parts.push(`descansar por ${ex.restTime} seg`);

    if (parts.length === 0) return 'Configurado';

    return `Frequência: ${parts.join(', ')}`;
}

function MyProgramDetail({ id }: { id: string }) {
    const navigate = useNavigate();
    const { data: program, isLoading } = useClinicProgram(id);

    if (isLoading) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (!program) return null;

    const totalExercises = program.groups.reduce(
        (acc, g) => acc + g.exercises.length,
        0,
    );

    return (
        <div className="p-6">
            <div className="mb-6 rounded-lg border border-border p-6">
                <h2 className="mb-3 text-xl font-semibold text-foreground">
                    {program.title}
                </h2>
                <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary">
                    Modelo
                </Badge>

                <div className="flex flex-wrap items-center gap-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Criado por
                            </p>
                            <p className="text-sm font-medium text-foreground">
                                Você
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Dumbbell className="h-4 w-4" />
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Exercícios
                            </p>
                            <p className="text-sm font-medium text-foreground">
                                {totalExercises} exercícios
                            </p>
                        </div>
                    </div>
                    {program.createdAt && (
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Criado em
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                    {new Date(
                                        program.createdAt,
                                    ).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {program.groups?.map((group) => (
                <div key={group.id} className="mb-6">
                    <div className="mb-4 flex items-center gap-2">
                        <h3 className="text-base font-medium text-foreground">
                            {group.name}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                            {group.exercises?.length ?? 0}
                        </span>
                    </div>

                    {group.exercises && group.exercises.length > 0 ? (
                        <div className="divide-y divide-border">
                            {group.exercises.map((ex) => (
                                <ExerciseRow
                                    key={ex.id}
                                    exercise={{
                                        id: Number(ex.exerciseId),
                                        name: ex.title,
                                        thumbnailUrl: ex.thumbnailUrl,
                                        videoUrl: ex.videoUrl,
                                    }}
                                    frequency={buildMyFrequency(ex)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="py-4 text-sm text-muted-foreground">
                            Nenhum exercício neste grupo
                        </p>
                    )}
                </div>
            ))}

            <div className="fixed right-6 bottom-6">
                <Button
                    size="lg"
                    className="shadow-lg"
                    onClick={() =>
                        navigate('/clinica/programas/novo', {
                            state: { program },
                        })
                    }
                >
                    Criar programa
                </Button>
            </div>
        </div>
    );
}

interface ProgramasTabProps {
    subTab: 'modelos' | 'meus-modelos';
}

export function ProgramasTab({ subTab }: ProgramasTabProps) {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedLibraryId, setSelectedLibraryId] = useState<number | null>(
        null,
    );
    const [selectedMyId, setSelectedMyId] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const {
        data: libraryData,
        isLoading: isLoadingLibrary,
        fetchNextPage: fetchNextLibrary,
        hasNextPage: hasNextLibrary,
        isFetchingNextPage: isFetchingNextLibrary,
    } = useInfiniteClinicProgramsLibrary(
        debouncedSearch ? { search: debouncedSearch } : undefined,
    );

    const {
        data: myData,
        isLoading: isLoadingMy,
        fetchNextPage: fetchNextMy,
        hasNextPage: hasNextMy,
        isFetchingNextPage: isFetchingNextMy,
    } = useInfiniteMyPrograms(
        debouncedSearch ? { search: debouncedSearch } : undefined,
    );

    const libraryPrograms = useMemo(
        () => libraryData?.pages.flatMap((p) => p.data) ?? [],
        [libraryData],
    );

    const myPrograms = useMemo(
        () => myData?.pages.flatMap((p) => p.items) ?? [],
        [myData],
    );

    const isLibrary = subTab === 'modelos';
    const currentPrograms = isLibrary ? libraryPrograms : myPrograms;
    const isLoading = isLibrary ? isLoadingLibrary : isLoadingMy;
    const fetchNext = isLibrary ? fetchNextLibrary : fetchNextMy;
    const hasNext = isLibrary ? hasNextLibrary : hasNextMy;
    const isFetchingNext = isLibrary ? isFetchingNextLibrary : isFetchingNextMy;

    const effectiveLibraryId =
        selectedLibraryId ?? libraryPrograms[0]?.id ?? null;
    const effectiveMyId = selectedMyId ?? myPrograms[0]?.id ?? null;

    function handleSearch(value: string) {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(value), 400);
    }

    // Infinite scroll
    useEffect(() => {
        const sentinel = sentinelRef.current;
        const container = listRef.current;
        if (!sentinel || !container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNext && !isFetchingNext) {
                    fetchNext();
                }
            },
            { root: container, threshold: 0.1 },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNext, isFetchingNext, fetchNext, currentPrograms.length]);

    return (
        <div className="flex h-[calc(100vh-160px)]">
            <div className="flex w-[360px] flex-shrink-0 flex-col border-r border-border bg-muted/10">
                <div className="space-y-4 border-b border-border p-4">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar modelo"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="bg-background pl-9"
                        />
                    </div>

                    <Tabs
                        value={subTab}
                        onValueChange={(v) =>
                            navigate(`/clinica/programas/${v}`)
                        }
                    >
                        <TabsList className="grid h-auto w-full grid-cols-2 gap-4 bg-transparent p-0">
                            <TabsTrigger
                                value="modelos"
                                className="rounded-none border-b-2 border-transparent px-1 pt-0 pb-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                            >
                                Nossos modelos
                            </TabsTrigger>
                            <TabsTrigger
                                value="meus-modelos"
                                className="rounded-none border-b-2 border-transparent px-1 pt-0 pb-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                            >
                                Meus modelos
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div
                    ref={listRef}
                    className="flex-1 overflow-auto bg-background"
                >
                    {isLoading && (
                        <div className="space-y-1 px-4 py-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={i} className="h-9 w-full" />
                            ))}
                        </div>
                    )}

                    {!isLoading && currentPrograms.length === 0 && (
                        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                            Nenhum modelo encontrado
                        </p>
                    )}

                    <div className="py-2">
                        {isLibrary
                            ? libraryPrograms.map((program) => (
                                  <button
                                      key={program.id}
                                      onClick={() =>
                                          setSelectedLibraryId(program.id)
                                      }
                                      className={cn(
                                          'w-full cursor-pointer border-l-2 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50',
                                          effectiveLibraryId === program.id
                                              ? 'border-primary bg-primary/5 font-medium text-primary'
                                              : 'border-transparent text-foreground',
                                      )}
                                  >
                                      {program.title}
                                  </button>
                              ))
                            : myPrograms.map((program) => (
                                  <button
                                      key={program.id}
                                      onClick={() =>
                                          setSelectedMyId(program.id)
                                      }
                                      className={cn(
                                          'w-full cursor-pointer border-l-2 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50',
                                          effectiveMyId === program.id
                                              ? 'border-primary bg-primary/5 font-medium text-primary'
                                              : 'border-transparent text-foreground',
                                      )}
                                  >
                                      {program.title}
                                  </button>
                              ))}
                        <div ref={sentinelRef} className="h-2" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-background">
                {isLoading ? (
                    <div className="space-y-4 p-6">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                ) : isLibrary ? (
                    effectiveLibraryId ? (
                        <ProgramDetail id={effectiveLibraryId} />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Selecione um modelo para visualizar
                        </div>
                    )
                ) : effectiveMyId ? (
                    <MyProgramDetail id={effectiveMyId} />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Selecione um modelo para visualizar
                    </div>
                )}
            </div>
        </div>
    );
}
