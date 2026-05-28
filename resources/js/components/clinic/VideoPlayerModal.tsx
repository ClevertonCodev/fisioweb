import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Maximize, Pause, Play, SkipBack, SkipForward, Star, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import type { Exercise } from '@/domain/clinic';
import { cn } from '@/lib/utils';

interface VideoPlayerModalProps {
    exercise: Exercise | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onToggleFavorite?: (exercise: Exercise) => void;
}

const difficultyLabels = {
    facil: 'Fácil',
    medio: 'Médio',
    dificil: 'Difícil',
};

const difficultyColors = {
    facil: 'bg-success/20 text-success border-success/30',
    medio: 'bg-warning/20 text-warning-foreground border-warning/30',
    dificil: 'bg-destructive/20 text-destructive border-destructive/30',
};

export function VideoPlayerModal({
    exercise,
    open,
    onOpenChange,
    onToggleFavorite,
}: VideoPlayerModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!open) {
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
        }
    }, [open]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (value: number[]) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = value[0];
        setCurrentTime(value[0]);
    };

    const handleVolumeChange = (value: number[]) => {
        const video = videoRef.current;
        if (!video) return;
        const newVolume = value[0];
        video.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        if (isMuted) {
            video.volume = volume || 0.5;
            setIsMuted(false);
        } else {
            video.volume = 0;
            setIsMuted(true);
        }
    };

    const skip = (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    };

    const toggleFullscreen = () => {
        const video = videoRef.current;
        if (!video) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            video.requestFullscreen();
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    const metaItems = [
        exercise?.specialty,
        exercise?.muscleGroup,
        exercise?.bodyArea,
        exercise?.bodyRegion,
        exercise?.movementType,
    ].filter(Boolean);

    if (!exercise) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[780px] gap-0 overflow-hidden p-0">
                <VisuallyHidden.Root>
                    <DialogTitle>{exercise.title}</DialogTitle>
                </VisuallyHidden.Root>

                <div className="flex min-h-[320px]">
                    {/* Left — Video */}
                    <div
                        className="relative w-[45%] flex-shrink-0 bg-black"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => isPlaying && setShowControls(false)}
                    >
                        <video
                            ref={videoRef}
                            src={exercise.videoUrl}
                            poster={exercise.thumbnailUrl}
                            className="absolute inset-0 h-full w-full object-contain"
                            onClick={togglePlay}
                            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                            onEnded={() => setIsPlaying(false)}
                        />

                        {!isPlaying && (
                            <button
                                onClick={togglePlay}
                                className="absolute inset-0 flex cursor-pointer items-center justify-center"
                            >
                                <div className="bg-background/80 border-border/30 flex h-16 w-16 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-transform duration-200 hover:scale-110">
                                    <Play className="text-foreground ml-0.5 h-8 w-8" />
                                </div>
                            </button>
                        )}

                        <div
                            className={cn(
                                'absolute right-0 bottom-0 left-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-3 transition-opacity duration-300',
                                showControls ? 'opacity-100' : 'opacity-0',
                            )}
                        >
                            <Slider
                                value={[currentTime]}
                                max={duration || 100}
                                step={0.1}
                                onValueChange={handleSeek}
                                className="mb-2 cursor-pointer"
                            />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-white hover:bg-white/20"
                                        onClick={() => skip(-10)}
                                    >
                                        <SkipBack className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                        onClick={togglePlay}
                                    >
                                        {isPlaying ? (
                                            <Pause className="h-4 w-4" />
                                        ) : (
                                            <Play className="ml-0.5 h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-white hover:bg-white/20"
                                        onClick={() => skip(10)}
                                    >
                                        <SkipForward className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-white hover:bg-white/20"
                                        onClick={toggleMute}
                                    >
                                        {isMuted ? (
                                            <VolumeX className="h-3.5 w-3.5" />
                                        ) : (
                                            <Volume2 className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                    <div className="w-14">
                                        <Slider
                                            value={[isMuted ? 0 : volume]}
                                            max={1}
                                            step={0.1}
                                            onValueChange={handleVolumeChange}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                    <span className="ml-1 text-xs whitespace-nowrap text-white">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-white hover:bg-white/20"
                                    onClick={toggleFullscreen}
                                >
                                    <Maximize className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right — Details */}
                    <div className="flex min-w-0 flex-1 flex-col overflow-hidden p-5 pr-12">
                        <div className="mb-3 flex items-start gap-3">
                            <h2 className="text-card-foreground min-w-0 flex-1 text-lg leading-snug font-semibold">
                                {exercise.title}
                            </h2>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'mt-0.5 shrink-0',
                                    difficultyColors[exercise.difficulty],
                                )}
                            >
                                {difficultyLabels[exercise.difficulty]}
                            </Badge>
                        </div>

                        {exercise.objective && (
                            <p className="text-foreground mb-4 text-sm leading-relaxed">
                                {exercise.objective}
                            </p>
                        )}

                        {metaItems.length > 0 && (
                            <div className="text-foreground flex flex-wrap gap-x-1 gap-y-1 text-sm">
                                {metaItems.map((item, i) => (
                                    <span key={i} className="flex items-center gap-1">
                                        {i > 0 && <span className="text-border">•</span>}
                                        {item}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="mt-auto flex justify-end pt-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onToggleFavorite?.(exercise)}
                            >
                                <Star
                                    className={cn(
                                        'h-5 w-5',
                                        exercise.isFavorite
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-muted-foreground',
                                    )}
                                />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
