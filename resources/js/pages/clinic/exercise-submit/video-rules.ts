import {
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    MAX_IMAGE_MB,
    MAX_VIDEO_MB,
} from '@/application/clinic/exercise-media-limits';

export { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_IMAGE_MB, MAX_VIDEO_MB };

export interface VideoInfo {
    width: number;
    height: number;
    duration: number;
    size: number;
    type: string;
}

const RECORDER_MIME_TYPES = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
];

/** Primeiro formato (MP4 ou WebM) que o MediaRecorder do navegador sabe gravar. */
export function pickRecorderMime(): string | null {
    if (
        typeof MediaRecorder === 'undefined' ||
        typeof MediaRecorder.isTypeSupported !== 'function'
    ) {
        return null;
    }
    return (
        RECORDER_MIME_TYPES.find((m) => MediaRecorder.isTypeSupported(m)) ??
        null
    );
}

/** Confere se o navegador suporta regravação de vídeo com canvas + MediaRecorder. */
export function canEditVideoInBrowser(): boolean {
    if (
        typeof window === 'undefined' ||
        typeof MediaRecorder === 'undefined' ||
        typeof HTMLCanvasElement === 'undefined'
    ) {
        return false;
    }
    return (
        typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
        pickRecorderMime() !== null
    );
}

const IMAGE_EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

/** Nome do arquivo recortado, com a extensão do tipo que o canvas gerou de fato. */
export function croppedImageName(
    originalName: string,
    mimeType: string,
): string {
    const base = originalName.replace(/\.[^.]+$/, '') || 'imagem';
    return `${base}-cropped.${IMAGE_EXTENSIONS[mimeType] ?? 'jpg'}`;
}

/** Valida formato (JPEG, PNG ou WebP) e tamanho máximo (5 MB) de imagem de capa/referência. */
export function validateExerciseImage(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return 'Use uma imagem JPEG, PNG ou WebP.';
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        return `A imagem não pode passar de ${MAX_IMAGE_MB} MB.`;
    }
    return null;
}

/** Lê largura, altura e duração do arquivo num <video> fora da tela. */
export function readVideoInfo(file: File): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.onloadedmetadata = () => {
            resolve({
                width: video.videoWidth,
                height: video.videoHeight,
                duration: video.duration,
                size: file.size,
                type: file.type,
            });
            URL.revokeObjectURL(url);
        };
        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Não foi possível ler o vídeo.'));
        };
        video.src = url;
    });
}

export type CheckState = 'ok' | 'warn' | 'fail';

export interface VideoCheck {
    key: string;
    label: string;
    detail: string;
    state: CheckState;
}

function mb(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(1).replace('.', ',');
}

function ratioLabel(w: number, h: number): string {
    const r = w / h;
    const known: [number, string][] = [
        [9 / 16, '9:16'],
        [3 / 4, '3:4'],
        [4 / 5, '4:5'],
        [1, '1:1'],
        [4 / 3, '4:3'],
        [16 / 9, '16:9'],
    ];
    const near = known.find(([k]) => Math.abs(k - r) < 0.04);
    return near ? near[1] : r.toFixed(2);
}

/** Quadrado (1:1, como post do Instagram), com a mesma folga do rótulo de proporção. */
export function isSquareVideo(width: number, height: number): boolean {
    return ratioLabel(width, height) === '1:1';
}

/** Maior quadrado dentro do quadro; `offset` (0 a 1) desliza o corte pelo lado que sobra. */
export function squareCrop(
    width: number,
    height: number,
    offset: number,
): { x: number; y: number; size: number } {
    const size = Math.min(width, height);
    return {
        x: Math.round((width - size) * offset),
        y: Math.round((height - size) * offset),
        size,
    };
}

/** Uma linha por regra; "fail" impede o envio, "warn" só avisa. */
export function checkVideo(info: VideoInfo): VideoCheck[] {
    const portrait = info.height > info.width;
    const square = isSquareVideo(info.width, info.height);
    const ratio = ratioLabel(info.width, info.height);
    const shortSide = Math.min(info.width, info.height);
    const typeOk = ALLOWED_VIDEO_TYPES.includes(info.type);
    return [
        {
            key: 'type',
            label: 'Formato',
            detail: typeOk
                ? info.type.replace('video/', '').toUpperCase()
                : 'Use MP4, MOV, AVI, WebM ou MKV',
            state: typeOk ? 'ok' : 'fail',
        },
        {
            key: 'size',
            label: 'Tamanho',
            detail: `${mb(info.size)} MB de ${MAX_VIDEO_MB} MB`,
            state: info.size <= MAX_VIDEO_MB * 1024 * 1024 ? 'ok' : 'fail',
        },
        {
            key: 'shape',
            label: 'Quadrado (1:1)',
            detail: square
                ? `1:1 · ${info.width}×${info.height}`
                : `${portrait ? 'Em pé' : 'Deitado'} (${ratio}) · precisa ser quadrado`,
            state: square ? 'ok' : 'fail',
        },
        {
            key: 'quality',
            label: 'Qualidade',
            detail:
                shortSide >= 480
                    ? `${shortSide}p`
                    : `${shortSide}p · pode ficar borrado no celular`,
            state: shortSide >= 480 ? 'ok' : 'warn',
        },
    ];
}

export function hasBlocking(checks: VideoCheck[]): boolean {
    return checks.some((c) => c.state === 'fail');
}
