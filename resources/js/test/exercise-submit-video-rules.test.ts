import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    canEditVideoInBrowser,
    checkVideo,
    croppedImageName,
    hasBlocking,
    MAX_IMAGE_MB,
    MAX_VIDEO_MB,
    squareCrop,
    validateExerciseImage,
} from '@/pages/clinic/exercise-submit/video-rules';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('regras do vídeo e imagem de exercício (exercise-submit)', () => {
    it('aprova vídeo quadrado 1:1 dentro de 20 MB e >= 480p sem bloqueio nem aviso', () => {
        const checks = checkVideo({
            width: 1080,
            height: 1080,
            duration: 30,
            size: 5 * 1024 * 1024,
            type: 'video/mp4',
        });

        expect(hasBlocking(checks)).toBe(false);
        expect(checks.every((c) => c.state === 'ok')).toBe(true);
        expect(checks.find((c) => c.key === 'shape')?.detail).toBe(
            '1:1 · 1080×1080',
        );
    });

    it('bloqueia vídeo deitado (16:9) e em pé (9:16): só quadrado passa', () => {
        const base = { duration: 20, size: 4 * 1024 * 1024, type: 'video/mp4' };

        const deitado = checkVideo({ ...base, width: 1280, height: 720 });
        expect(hasBlocking(deitado)).toBe(true);
        expect(deitado.find((c) => c.key === 'shape')).toMatchObject({
            state: 'fail',
            detail: 'Deitado (16:9) · precisa ser quadrado',
        });

        const emPe = checkVideo({ ...base, width: 720, height: 1280 });
        expect(hasBlocking(emPe)).toBe(true);
        expect(emPe.find((c) => c.key === 'shape')).toMatchObject({
            state: 'fail',
            detail: 'Em pé (9:16) · precisa ser quadrado',
        });
    });

    it('bloqueia vídeo acima de 20 MB', () => {
        const checks = checkVideo({
            width: 1080,
            height: 1080,
            duration: 45,
            size: (MAX_VIDEO_MB + 1) * 1024 * 1024,
            type: 'video/mp4',
        });

        expect(hasBlocking(checks)).toBe(true);
        const size = checks.find((c) => c.key === 'size');
        expect(size?.state).toBe('fail');
    });

    it('emite aviso (sem bloquear) para vídeo quadrado abaixo de 480p', () => {
        const checks = checkVideo({
            width: 360,
            height: 360,
            duration: 15,
            size: 2 * 1024 * 1024,
            type: 'video/webm',
        });

        expect(hasBlocking(checks)).toBe(false);
        expect(checks.find((c) => c.key === 'quality')?.state).toBe('warn');
    });

    it('squareCrop corta as laterais do deitado e em cima e embaixo do em pé', () => {
        expect(squareCrop(1920, 1080, 0)).toEqual({ x: 0, y: 0, size: 1080 });
        expect(squareCrop(1920, 1080, 1)).toEqual({ x: 840, y: 0, size: 1080 });
        expect(squareCrop(1920, 1080, 0.5)).toEqual({
            x: 420,
            y: 0,
            size: 1080,
        });
        expect(squareCrop(720, 1280, 0.5)).toEqual({ x: 0, y: 280, size: 720 });
        expect(squareCrop(720, 1280, 0)).toEqual({ x: 0, y: 0, size: 720 });
        expect(squareCrop(1080, 1080, 0.5)).toEqual({ x: 0, y: 0, size: 1080 });
    });

    it('valida formato e tamanho máximo (5 MB) de imagem de capa/referência', () => {
        const valid = new File([new Uint8Array(1024)], 'capa.jpg', {
            type: 'image/jpeg',
        });
        expect(validateExerciseImage(valid)).toBeNull();

        const wrongType = new File([new Uint8Array(1024)], 'capa.gif', {
            type: 'image/gif',
        });
        expect(validateExerciseImage(wrongType)).toMatch(/JPEG, PNG ou WebP/);

        const tooBig = new File(
            [new Uint8Array((MAX_IMAGE_MB + 1) * 1024 * 1024)],
            'grande.png',
            { type: 'image/png' },
        );
        expect(validateExerciseImage(tooBig)).toMatch(/5 MB/);
    });

    it('canEditVideoInBrowser confere suporte a MediaRecorder e captureStream', () => {
        const originalMediaRecorder = globalThis.MediaRecorder;
        const originalCaptureStream = HTMLCanvasElement.prototype.captureStream;

        try {
            // Sem MediaRecorder → false
            Reflect.deleteProperty(globalThis, 'MediaRecorder');
            expect(canEditVideoInBrowser()).toBe(false);

            // Com MediaRecorder + captureStream → true
            globalThis.MediaRecorder = Object.assign(function () {}, {
                isTypeSupported: (m: string) => m === 'video/webm',
            }) as unknown as typeof MediaRecorder;
            HTMLCanvasElement.prototype.captureStream = vi.fn();
            expect(canEditVideoInBrowser()).toBe(true);

            // Só "video/mp4" sem codecs (Safari) → true
            globalThis.MediaRecorder = Object.assign(function () {}, {
                isTypeSupported: (m: string) => m === 'video/mp4',
            }) as unknown as typeof MediaRecorder;
            expect(canEditVideoInBrowser()).toBe(true);

            // MediaRecorder sem MP4 nem WebM → false
            globalThis.MediaRecorder = Object.assign(function () {}, {
                isTypeSupported: () => false,
            }) as unknown as typeof MediaRecorder;
            expect(canEditVideoInBrowser()).toBe(false);
        } finally {
            globalThis.MediaRecorder = originalMediaRecorder;
            HTMLCanvasElement.prototype.captureStream = originalCaptureStream;
        }
    });

    it('croppedImageName usa a extensão do tipo gerado pelo recorte', () => {
        expect(croppedImageName('inicio.jpeg', 'image/jpeg')).toBe(
            'inicio-cropped.jpg',
        );
        expect(croppedImageName('IMG_1234', 'image/jpeg')).toBe(
            'IMG_1234-cropped.jpg',
        );
        // Safari devolve PNG quando não sabe gerar WebP.
        expect(croppedImageName('final.webp', 'image/png')).toBe(
            'final-cropped.png',
        );
        expect(croppedImageName('', 'image/webp')).toBe('imagem-cropped.webp');
    });
});
