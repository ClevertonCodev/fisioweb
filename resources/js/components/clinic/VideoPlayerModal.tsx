import * as React from 'react';
import {
    Maximize,
    Pause,
    Play,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/types/exercise';

const difficultyLabels: Record<string, string> = {
    facil: 'Fácil',
    medio: 'Médio',
    dificil: 'Difícil',
};

const difficultyColors: Record<string, string> = {
    facil: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    medio: 'border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-400',
    dificil: 'border-destructive/30 bg-destructive/20 text-destructive',
};

interface VideoPlayerModalProps {
    exercise: Exercise | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function VideoPlayerModal({
    exercise,
    open,
    onOpenChange,
}: VideoPlayerModalProps) {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [volume, setVolume] = React.useState(1);
    const [isMuted, setIsMuted] = React.useState(false);
    const [showControls, setShowControls] = React.useState(true);
    const controlsTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    React.useEffect(() => {
        if (!open) {
            setIsPlaying(false);
            setCurrentTime(0);
        }
    }, [open]);

    React.useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => setDuration(video.duration);
        const handleEnded = () => setIsPlaying(false);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('ended', handleEnded);
        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('ended', handleEnded);
        };
    }, [exercise]);

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
        video.currentTime = Math.max(
            0,
            Math.min(duration, video.currentTime + seconds),
        );
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
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    };

    if (!exercise) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl overflow-hidden border-border bg-card p-0">
                <span className="sr-only">{exercise.title}</span>
                <div
                    className="relative aspect-video bg-black"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() =>
                        isPlaying && setShowControls(false)
                    }
                >
                    <video
                        ref={videoRef}
                        src={exercise.videoUrl}
                        poster={exercise.thumbnailUrl}
                        className="h-full w-full object-contain"
                        onClick={togglePlay}
                    />
                    {!isPlaying && (
                        <button
                            type="button"
                            onClick={togglePlay}
                            className="absolute inset-0 flex items-center justify-center bg-foreground/20"
                        >
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg transition-transform hover:scale-110">
                                <Play className="ml-1 h-10 w-10 text-primary-foreground" />
                            </div>
                        </button>
                    )}
                    <div
                        className={cn(
                            'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300',
                            showControls ? 'opacity-100' : 'opacity-0',
                        )}
                    >
                        <div className="mb-3">
                            <Slider
                                value={[currentTime]}
                                max={duration || 100}
                                step={0.1}
                                onValueChange={handleSeek}
                                className="cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-white hover:bg-white/20"
                                    onClick={() => skip(-10)}
                                >
                                    <SkipBack className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-white hover:bg-white/20"
                                    onClick={togglePlay}
                                >
                                    {isPlaying ? (
                                        <Pause className="h-5 w-5" />
                                    ) : (
                                        <Play className="ml-0.5 h-5 w-5" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-white hover:bg-white/20"
                                    onClick={() => skip(10)}
                                >
                                    <SkipForward className="h-4 w-4" />
                                </Button>
                                <div className="ml-2 flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                        onClick={toggleMute}
                                    >
                                        {isMuted ? (
                                            <VolumeX className="h-4 w-4" />
                                        ) : (
                                            <Volume2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <div className="w-20">
                                        <Slider
                                            value={[isMuted ? 0 : volume]}
                                            max={1}
                                            step={0.1}
                                            onValueChange={handleVolumeChange}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <span className="ml-3 text-sm text-white">
                                    {formatTime(currentTime)} /{' '}
                                    {formatTime(duration)}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20"
                                onClick={toggleFullscreen}
                            >
                                <Maximize className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="border-t border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h2 className="mb-1 text-lg font-semibold text-card-foreground">
                                {exercise.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span>{exercise.specialty}</span>
                                <span>•</span>
                                <span>{exercise.muscleGroup}</span>
                                <span>•</span>
                                <span>{exercise.equipment}</span>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn(
                                'shrink-0',
                                difficultyColors[exercise.difficulty],
                            )}
                        >
                            {difficultyLabels[exercise.difficulty]}
                        </Badge>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
