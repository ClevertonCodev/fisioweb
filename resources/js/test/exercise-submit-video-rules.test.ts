import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    canEditVideoInBrowser,
    checkVideo,
    hasBlocking,
    MAX_IMAGE_MB,
    MAX_VIDEO_MB,
    validateExerciseImage,
} from '@/pages/clinic/exercise-submit/video-rules';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('regras do vídeo e imagem de exercício (exercise-submit)', () => {
    it('aprova vídeo em pé 9:16 dentro de 20 MB e >= 480p sem bloqueio nem aviso', () => {
        const checks = checkVideo({
            width: 720,
            height: 1280,
            duration: 30,
            size: 5 * 1024 * 1024,
            type: 'video/mp4',
        });

        expect(hasBlocking(checks)).toBe(false);
        expect(checks.every((c) => c.state === 'ok')).toBe(true);
    });

    it('bloqueia vídeo deitado (16:9)', () => {
        const checks = checkVideo({
            width: 1280,
            height: 720,
            duration: 20,
            size: 4 * 1024 * 1024,
            type: 'video/mp4',
        });

        expect(hasBlocking(checks)).toBe(true);
        const orientation = checks.find((c) => c.key === 'orientation');
        expect(orientation?.state).toBe('fail');
        expect(orientation?.detail).toMatch(/Deitado/);
    });

    it('bloqueia vídeo acima de 20 MB', () => {
        const checks = checkVideo({
            width: 720,
            height: 1280,
            duration: 45,
            size: (MAX_VIDEO_MB + 1) * 1024 * 1024,
            type: 'video/mp4',
        });

        expect(hasBlocking(checks)).toBe(true);
        const size = checks.find((c) => c.key === 'size');
        expect(size?.state).toBe('fail');
    });

    it('emite aviso (sem bloquear) para vídeo em pé fora de 9:16 ou abaixo de 480p', () => {
        const checks = checkVideo({
            width: 360,
            height: 480,
            duration: 15,
            size: 2 * 1024 * 1024,
            type: 'video/webm',
        });

        expect(hasBlocking(checks)).toBe(false);
        expect(checks.find((c) => c.key === 'orientation')?.state).toBe('warn');
        expect(checks.find((c) => c.key === 'quality')?.state).toBe('warn');
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
            globalThis.MediaRecorder =
                function () {} as unknown as typeof MediaRecorder;
            HTMLCanvasElement.prototype.captureStream = vi.fn();
            expect(canEditVideoInBrowser()).toBe(true);
        } finally {
            globalThis.MediaRecorder = originalMediaRecorder;
            HTMLCanvasElement.prototype.captureStream = originalCaptureStream;
        }
    });
});
