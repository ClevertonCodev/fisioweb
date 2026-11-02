import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadAndSyncClinicVideoReferenceImages } from '@/application/clinic/upload-video-reference-images';
import {
    useSubmitExercise,
    type SubmitExerciseInput,
} from '@/application/clinic/use-submit-exercise';
import {
    apiClinicExercisesRepository,
    apiClinicVideosRepository,
} from '@/infrastructure/repositories';

vi.mock('@/infrastructure/api/client', () => ({ apiClient: { get: vi.fn() } }));

vi.mock('@/infrastructure/repositories', () => ({
    apiClinicVideosRepository: {
        requestPresignedUpload: vi.fn(),
        requestPresignedThumbnail: vi.fn(),
        confirmUpload: vi.fn(),
    },
    apiClinicExercisesRepository: { submit: vi.fn() },
}));

vi.mock('@/application/clinic/upload-video-reference-images', () => ({
    uploadAndSyncClinicVideoReferenceImages: vi.fn(),
}));

/** XHR falso: todo PUT presigned responde 200 no próximo tick. */
class FakeXhr {
    status = 200;
    upload = { addEventListener: vi.fn() };
    private listeners: Record<string, () => void> = {};
    addEventListener(name: string, cb: () => void) {
        this.listeners[name] = cb;
    }
    open() {}
    setRequestHeader() {}
    abort() {}
    send() {
        setTimeout(() => this.listeners.load?.(), 0);
    }
}

function wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
    });
    return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

function input(
    overrides: Partial<SubmitExerciseInput> = {},
): SubmitExerciseInput {
    return {
        name: 'Ponte glútea',
        physioAreaId: 1,
        difficultyLevel: 'easy',
        videoFile: new File(['v'], 'ponte.mp4', { type: 'video/mp4' }),
        ...overrides,
    };
}

beforeEach(() => {
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
    vi.mocked(
        apiClinicVideosRepository.requestPresignedUpload,
    ).mockResolvedValue({
        video_id: 7,
        upload_url: 'https://r2/put',
        path: 'videos/x.mp4',
    } as never);
    vi.mocked(apiClinicVideosRepository.confirmUpload).mockResolvedValue(
        {} as never,
    );
    vi.mocked(apiClinicExercisesRepository.submit).mockResolvedValue({
        id: 99,
    } as never);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('useSubmitExercise', () => {
    it('não rejeita a promise quando o envio falha e mostra a mensagem da API', async () => {
        vi.mocked(apiClinicExercisesRepository.submit).mockRejectedValue(
            Object.assign(new Error('Request failed with status code 422'), {
                response: {
                    status: 422,
                    data: {
                        message:
                            'O vídeo selecionado não pertence a esta clínica.',
                    },
                },
            }),
        );
        const { result } = renderHook(() => useSubmitExercise(), { wrapper });

        let returned: unknown = 'não resolveu';
        await act(async () => {
            returned = await result.current.submit(input());
        });

        expect(returned).toBeNull();
        await waitFor(() => expect(result.current.status).toBe('error'));
        expect(result.current.error).toBe(
            'O vídeo selecionado não pertence a esta clínica.',
        );
    });

    it('mostra mensagem em português quando o servidor falha com 5xx', async () => {
        vi.mocked(apiClinicExercisesRepository.submit).mockRejectedValue(
            Object.assign(new Error('Request failed with status code 500'), {
                isAxiosError: true,
                response: { status: 500, data: { message: 'Server Error' } },
            }),
        );
        const { result } = renderHook(() => useSubmitExercise(), { wrapper });

        await act(async () => {
            await result.current.submit(input());
        });

        await waitFor(() => expect(result.current.status).toBe('error'));
        expect(result.current.error).toBe(
            'Não foi possível falar com o servidor. Tente de novo.',
        );
    });

    it('diz que o servidor recusou quando ele responde sem mensagem (ex.: 413 em HTML)', async () => {
        vi.mocked(apiClinicExercisesRepository.submit).mockRejectedValue(
            Object.assign(new Error('Request failed with status code 413'), {
                isAxiosError: true,
                response: { status: 413, data: '<html>' },
            }),
        );
        const { result } = renderHook(() => useSubmitExercise(), { wrapper });

        await act(async () => {
            await result.current.submit(input());
        });

        await waitFor(() => expect(result.current.status).toBe('error'));
        expect(result.current.error).toBe(
            'O servidor recusou o envio (código 413). Tente de novo.',
        );
    });

    it('conclui o envio com aviso quando só as fotos do PDF falham, sem deixar reenviar o exercício', async () => {
        vi.mocked(uploadAndSyncClinicVideoReferenceImages).mockRejectedValue(
            new Error('Cada imagem de referência não pode exceder 5MB.'),
        );
        const { result } = renderHook(() => useSubmitExercise(), { wrapper });

        await act(async () => {
            await result.current.submit(
                input({
                    referenceImages: [
                        new File(['i'], 'foto.jpg', { type: 'image/jpeg' }),
                    ],
                }),
            );
        });

        await waitFor(() => expect(result.current.status).toBe('completed'));
        expect(result.current.error).toBeNull();
        expect(result.current.warning).toBe(
            'O exercício foi enviado, mas as fotos do PDF não foram salvas (Cada imagem de referência não pode exceder 5MB). Não envie o exercício de novo: ele já está na biblioteca.',
        );
        expect(apiClinicExercisesRepository.submit).toHaveBeenCalledTimes(1);

        act(() => result.current.reset());
        expect(result.current.warning).toBeNull();
        expect(result.current.status).toBe('idle');
    });

    it('não pede para tentar de novo quando as fotos do PDF falham no servidor', async () => {
        vi.mocked(uploadAndSyncClinicVideoReferenceImages).mockRejectedValue(
            Object.assign(new Error('Request failed with status code 500'), {
                isAxiosError: true,
                response: { status: 500, data: {} },
            }),
        );
        const { result } = renderHook(() => useSubmitExercise(), { wrapper });

        await act(async () => {
            await result.current.submit(
                input({
                    referenceImages: [
                        new File(['i'], 'foto.jpg', { type: 'image/jpeg' }),
                    ],
                }),
            );
        });

        await waitFor(() => expect(result.current.status).toBe('completed'));
        expect(result.current.warning).toBe(
            'O exercício foi enviado, mas as fotos do PDF não foram salvas (o servidor não respondeu). Não envie o exercício de novo: ele já está na biblioteca.',
        );
    });
});
