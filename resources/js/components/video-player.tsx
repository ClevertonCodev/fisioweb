import {
    Maximize,
    Pause,
    Play,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export interface VideoPlayerProps {
    src: string;
    poster?: string | null;
    title?: string;
    className?: string;
}

function formatTime(time: number): string {
    if (!Number.isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function isValidDuration(d: number): boolean {
    return Number.isFinite(d) && !Number.isNaN(d) && d > 0;
}

export function VideoPlayer({ src, poster, title, className }: VideoPlayerProps) {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [volume, setVolume] = React.useState(1);
    const [isMuted, setIsMuted] = React.useState(false);
    const [showControls, setShowControls] = React.useState(true);
    const [isSeeking, setIsSeeking] = React.useState(false);
    const controlsTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const updateDuration = React.useCallback((d: number) => {
        if (isValidDuration(d)) {
            setDuration(d);
        }
    }, []);

    React.useEffect(() => {
        setCurrentTime(0);
        setDuration(0);
    }, [src]);

    React.useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        const handleLoadedMetadata = () => updateDuration(video.duration);
        const handleDurationChange = () => updateDuration(video.duration);
        const handleTimeUpdate = () => {
            if (!isSeeking) {
                setCurrentTime(video.currentTime);
            }
            if (isValidDuration(video.duration)) {
                setDuration((prev) => (isValidDuration(prev) ? prev : video.duration));
            }
        };
        const handleEnded = () => setIsPlaying(false);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('durationchange', handleDurationChange);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        if (video.readyState >= 1 && isValidDuration(video.duration)) {
            setDuration(video.duration);
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('durationchange', handleDurationChange);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [src, isSeeking, updateDuration]);

    const togglePlay = React.useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (isPlaying) {
            video.pause();
        } else {
            video.play().catch(() => {});
        }
    }, [isPlaying]);

    const handleSeek = React.useCallback((value: number[]) => {
        const video = videoRef.current;
        if (!video) return;
        const t = value[0];
        video.currentTime = t;
        setCurrentTime(t);
    }, []);

    const handleSeekStart = React.useCallback(() => setIsSeeking(true), []);
    const handleSeekEnd = React.useCallback(() => setIsSeeking(false), []);

    const handleVolumeChange = React.useCallback((value: number[]) => {
        const video = videoRef.current;
        if (!video) return;
        const newVolume = value[0];
        video.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    }, []);

    const toggleMute = React.useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (isMuted) {
            video.volume = volume || 0.5;
            setVolume(volume || 0.5);
            setIsMuted(false);
        } else {
            video.volume = 0;
            setIsMuted(true);
        }
    }, [isMuted, volume]);

    const skip = React.useCallback((seconds: number) => {
        const video = videoRef.current;
        if (!video) return;
        const d = isValidDuration(video.duration) ? video.duration : duration;
        video.currentTime = Math.max(0, Math.min(d, video.currentTime + seconds));
        setCurrentTime(video.currentTime);
    }, [duration]);

    const toggleFullscreen = React.useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            video.requestFullscreen();
        }
    }, []);

    const handleMouseMove = React.useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    }, [isPlaying]);

    const sliderMax = duration > 0 ? duration : 1;

    return (
        <div
            className={cn('relative aspect-video overflow-hidden bg-black', className)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster ?? undefined}
                className="h-full w-full cursor-pointer object-contain"
                onClick={togglePlay}
                playsInline
                preload="metadata"
            />
            {title && <span className="sr-only">{title}</span>}

            {!isPlaying && (
                <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute inset-0 flex cursor-pointer items-center justify-center bg-foreground/20"
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
                        max={sliderMax}
                        step={0.1}
                        onValueChange={handleSeek}
                        onPointerDown={handleSeekStart}
                        onPointerUp={handleSeekEnd}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                                setIsSeeking(true);
                            }
                        }}
                        onKeyUp={() => setIsSeeking(false)}
                        className="cursor-pointer [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing"
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
                        <span className="ml-3 text-sm text-white tabular-nums">
                            {formatTime(currentTime)} / {formatTime(duration)}
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
    );
}
