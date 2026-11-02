import { Scissors } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { DsButton, dsCn, DsModal } from '@/components/ds';

import { useObjectUrl } from './use-object-url';
import {
    isSquareVideo,
    MAX_VIDEO_MB,
    pickRecorderMime,
    readVideoInfo,
    squareCrop,
    type VideoInfo,
} from './video-rules';

const BITRATE = 2_500_000;
const MAX_OUT_SIDE = 1080;

function fmt(t: number): string {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const d = Math.floor((t % 1) * 10);
    return `${m}:${String(s).padStart(2, '0')}.${d}`;
}

type Crop = ReturnType<typeof squareCrop>;

async function renderClip(
    file: File,
    info: VideoInfo,
    crop: Crop,
    start: number,
    end: number,
    onProgress: (p: number) => void,
): Promise<File> {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.playsInline = true;
    await new Promise((r) => (video.onloadedmetadata = r));

    const out = Math.round(Math.min(crop.size, MAX_OUT_SIDE) / 2) * 2;

    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d')!;
    const stream = canvas.captureStream(30);

    const audio = new AudioContext();
    const source = audio.createMediaElementSource(video);
    const dest = audio.createMediaStreamDestination();
    source.connect(dest);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));

    const mime = pickRecorderMime() ?? 'video/webm';
    const recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: BITRATE,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const stopped = new Promise((r) => (recorder.onstop = r));

    video.currentTime = start;
    await new Promise((r) => (video.onseeked = r));

    let running = true;
    const draw = () => {
        if (!running) return;
        ctx.drawImage(
            video,
            crop.x,
            crop.y,
            crop.size,
            crop.size,
            0,
            0,
            out,
            out,
        );
        onProgress(
            Math.min(
                1,
                Math.max(0, (video.currentTime - start) / (end - start)),
            ),
        );
        if (video.currentTime >= end || video.ended) {
            running = false;
            video.pause();
            recorder.stop();
            return;
        }
        requestAnimationFrame(draw);
    };

    recorder.start(250);
    await video.play();
    draw();
    await stopped;
    await audio.close();
    URL.revokeObjectURL(url);

    const type = mime.split(';')[0]!;
    const ext = type === 'video/mp4' ? 'mp4' : 'webm';
    const base = file.name.replace(/\.[^.]+$/, '');
    return new File(chunks, `${base}-ajustado.${ext}`, { type });
}

export function VideoEditor({
    file,
    open,
    onClose,
    onApply,
}: {
    file: File | null;
    open: boolean;
    onClose: () => void;
    onApply: (file: File) => void;
}) {
    const url = useObjectUrl(open ? file : null);
    const preview = useRef<HTMLVideoElement>(null);
    const [info, setInfo] = useState<VideoInfo | null>(null);
    const [offset, setOffset] = useState(0.5);
    const [range, setRange] = useState<[number, number]>([0, 0]);
    const [progress, setProgress] = useState<number | null>(null);

    const [seen, setSeen] = useState<File | null>(null);
    if (open && file && seen !== file) {
        setSeen(file);
        setInfo(null);
        setProgress(null);
    }

    useEffect(() => {
        if (!open || !file || info) return;
        let alive = true;
        readVideoInfo(file).then((i) => {
            if (!alive) return;
            setInfo(i);
            setRange([0, i.duration]);
            setOffset(0.5);
        });
        return () => {
            alive = false;
        };
    }, [open, file, info]);

    const square = info ? isSquareVideo(info.width, info.height) : true;
    const portrait = info ? info.height > info.width : false;
    // Já quadrado: grava o quadro inteiro (a folga do 1:1 não vira corte).
    const crop: Crop | null = info
        ? square
            ? { x: 0, y: 0, size: Math.min(info.width, info.height) }
            : squareCrop(info.width, info.height, offset)
        : null;
    /** Quanto do lado maior sobra fora do quadrado, de 0 a 1. */
    const leftover =
        info && !square
            ? 1 -
              Math.min(info.width, info.height) /
                  Math.max(info.width, info.height)
            : 0;
    const [start, end] = range;
    const clip = Math.max(0, end - start);
    const estimateMb = (clip * BITRATE) / 8 / 1024 / 1024;
    const processing = progress !== null;

    const playClip = () => {
        const v = preview.current;
        if (!v) return;
        v.currentTime = start;
        void v.play();
    };

    const apply = async () => {
        if (!file || !info || !crop) return;
        setProgress(0);
        preview.current?.pause();
        const out = await renderClip(file, info, crop, start, end, setProgress);
        setProgress(null);
        onApply(out);
    };

    return (
        <DsModal
            open={open}
            onOpenChange={(o) => !o && !processing && onClose()}
            closeOnBackdrop={!processing}
            title="Ajustar vídeo"
            meta="Corte em quadrado (1:1) e escolha o trecho"
            size="lg"
            footer={
                <div className="flex w-full flex-wrap items-center gap-3">
                    <span className="mr-auto text-ds-caption text-ds-content-muted">
                        Trecho de {fmt(clip)} · ≈{' '}
                        {estimateMb.toFixed(1).replace('.', ',')} MB
                        {estimateMb > MAX_VIDEO_MB && ' (acima do limite)'}
                    </span>
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        disabled={processing}
                        onClick={onClose}
                    />
                    <DsButton
                        iconPosition="left"
                        icon={<Scissors />}
                        label={
                            processing
                                ? `Processando… ${Math.round((progress ?? 0) * 100)}%`
                                : 'Aplicar ajuste'
                        }
                        loading={processing}
                        disabled={
                            !info || clip < 1 || estimateMb > MAX_VIDEO_MB
                        }
                        onClick={apply}
                    />
                </div>
            }
        >
            {url && info ? (
                <div className="flex flex-col gap-5">
                    <div
                        className="relative mx-auto max-h-[48vh] w-full overflow-hidden rounded-ds-lg bg-black"
                        style={{
                            aspectRatio: `${info.width} / ${info.height}`,
                            maxWidth: `calc(48vh * ${info.width / info.height})`,
                        }}
                    >
                        <video
                            ref={preview}
                            src={url}
                            playsInline
                            muted
                            onTimeUpdate={(e) => {
                                if (e.currentTarget.currentTime >= end) {
                                    e.currentTarget.pause();
                                }
                            }}
                            className="size-full object-contain"
                        />
                        {leftover > 0 &&
                            (portrait ? (
                                <>
                                    <div
                                        className="pointer-events-none absolute inset-x-0 top-0 bg-black/60"
                                        style={{
                                            height: `${leftover * offset * 100}%`,
                                        }}
                                    />
                                    <div
                                        className="pointer-events-none absolute inset-x-0 border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
                                        style={{
                                            top: `${leftover * offset * 100}%`,
                                            height: `${(1 - leftover) * 100}%`,
                                        }}
                                    />
                                    <div
                                        className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/60"
                                        style={{
                                            height: `${leftover * (1 - offset) * 100}%`,
                                        }}
                                    />
                                </>
                            ) : (
                                <>
                                    <div
                                        className="pointer-events-none absolute inset-y-0 left-0 bg-black/60"
                                        style={{
                                            width: `${leftover * offset * 100}%`,
                                        }}
                                    />
                                    <div
                                        className="pointer-events-none absolute inset-y-0 border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
                                        style={{
                                            left: `${leftover * offset * 100}%`,
                                            width: `${(1 - leftover) * 100}%`,
                                        }}
                                    />
                                    <div
                                        className="pointer-events-none absolute inset-y-0 right-0 bg-black/60"
                                        style={{
                                            width: `${leftover * (1 - offset) * 100}%`,
                                        }}
                                    />
                                </>
                            ))}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="flex flex-col gap-3">
                            <div>
                                <p className="text-ds-body-sm font-semibold text-ds-content-primary">
                                    Corte quadrado (1:1)
                                </p>
                                <p className="text-ds-caption text-ds-content-muted">
                                    {square
                                        ? 'O vídeo já está quadrado.'
                                        : portrait
                                          ? 'O vídeo está mais alto que um quadrado.'
                                          : 'O vídeo está mais largo que um quadrado.'}
                                </p>
                            </div>
                            <label
                                className={dsCn(
                                    'flex flex-col gap-1.5',
                                    square && 'opacity-50',
                                )}
                            >
                                <span className="text-ds-caption font-medium text-ds-content-secondary">
                                    Posição do corte
                                </span>
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={offset}
                                    disabled={square || processing}
                                    onChange={(e) =>
                                        setOffset(Number(e.target.value))
                                    }
                                    className="w-full cursor-pointer accent-[var(--ds-color-primary-80)]"
                                />
                                <span className="flex justify-between text-ds-caption text-ds-content-muted">
                                    <span>
                                        {portrait ? 'Em cima' : 'Esquerda'}
                                    </span>
                                    <span>
                                        {portrait ? 'Embaixo' : 'Direita'}
                                    </span>
                                </span>
                            </label>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="flex flex-col gap-1.5">
                                <span className="flex justify-between text-ds-caption font-medium text-ds-content-secondary">
                                    Início
                                    <span className="font-ds-mono text-ds-content-muted">
                                        {fmt(start)}
                                    </span>
                                </span>
                                <input
                                    type="range"
                                    min={0}
                                    max={info.duration}
                                    step={0.1}
                                    value={start}
                                    disabled={processing}
                                    onChange={(e) => {
                                        const v = Math.min(
                                            Number(e.target.value),
                                            end - 1,
                                        );
                                        setRange([Math.max(0, v), end]);
                                        if (preview.current) {
                                            preview.current.currentTime = v;
                                        }
                                    }}
                                    className="w-full cursor-pointer accent-[var(--ds-color-primary-80)]"
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="flex justify-between text-ds-caption font-medium text-ds-content-secondary">
                                    Fim
                                    <span className="font-ds-mono text-ds-content-muted">
                                        {fmt(end)}
                                    </span>
                                </span>
                                <input
                                    type="range"
                                    min={0}
                                    max={info.duration}
                                    step={0.1}
                                    value={end}
                                    disabled={processing}
                                    onChange={(e) => {
                                        const v = Math.max(
                                            Number(e.target.value),
                                            start + 1,
                                        );
                                        setRange([
                                            start,
                                            Math.min(info.duration, v),
                                        ]);
                                        if (preview.current) {
                                            preview.current.currentTime = v;
                                        }
                                    }}
                                    className="w-full cursor-pointer accent-[var(--ds-color-primary-80)]"
                                />
                            </label>
                            <div>
                                <DsButton
                                    variant="tertiary"
                                    size="sm"
                                    label="Ver o trecho"
                                    disabled={processing}
                                    onClick={playClip}
                                />
                            </div>
                        </div>
                    </div>

                    {processing && (
                        <div className="h-2 overflow-hidden rounded-ds-pill bg-ds-surface-subtle">
                            <div
                                className="h-full rounded-ds-pill bg-ds-primary-80 transition-[width] duration-200"
                                style={{ width: `${(progress ?? 0) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-64 animate-pulse rounded-ds-lg bg-ds-surface-subtle" />
            )}
        </DsModal>
    );
}
