/** Limites de vídeo e imagem do envio de exercício da clínica (o back-end confere de novo). */
export const MAX_VIDEO_MB = 20;
export const MAX_IMAGE_MB = 5;

export const ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-flv',
    'video/x-matroska',
];

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
