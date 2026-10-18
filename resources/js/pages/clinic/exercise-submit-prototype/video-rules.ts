/**
 * PROTÓTIPO (descartável): regras do vídeo do exercício, conferidas no
 * navegador ao escolher o arquivo. O back-end hoje só confere tipo e o
 * tamanho declarado (até 500 MB em config/cloudflare.php) e não abre o
 * vídeo, então orientação e duração só existem aqui.
 */
export const MAX_VIDEO_MB = 20;

export const ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-flv',
    'video/x-matroska',
];

export interface VideoInfo {
    width: number;
    height: number;
    duration: number;
    size: number;
    type: string;
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

/** Uma linha por regra; "fail" impede o envio, "warn" só avisa. */
export function checkVideo(info: VideoInfo): VideoCheck[] {
    const portrait = info.height > info.width;
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
            key: 'orientation',
            label: 'Em pé (formato de celular)',
            detail: portrait
                ? `${ratio} · ${info.width}×${info.height}`
                : `Deitado (${ratio}) · precisa estar em pé`,
            state: portrait ? (ratio === '9:16' ? 'ok' : 'warn') : 'fail',
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
