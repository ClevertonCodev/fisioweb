import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadAndSyncVideoReferenceImages } from '@/application/admin/upload-video-reference-images';
import { uploadAndSyncClinicVideoReferenceImages } from '@/application/clinic/upload-video-reference-images';

const adminSync = vi.fn();
const clinicSync = vi.fn();

vi.mock('@/infrastructure/repositories', () => ({
    apiAdminVideosRepository: {
        syncReferenceImageSlots: (...a: unknown[]) => adminSync(...a),
    },
    apiClinicVideosRepository: {
        syncReferenceImageSlots: (...a: unknown[]) => clinicSync(...a),
    },
}));

describe('manter imagem de referência pela posição', () => {
    beforeEach(() => {
        adminSync.mockReset().mockResolvedValue(null);
        clinicSync.mockReset().mockResolvedValue(null);
    });

    it.each([
        ['admin', uploadAndSyncVideoReferenceImages, adminSync],
        ['clínica', uploadAndSyncClinicVideoReferenceImages, clinicSync],
    ] as const)(
        '%s manda o link que a tela mostrou junto com a posição mantida',
        async (_quem, sync, repo) => {
            await sync(9, [
                null,
                { url: 'https://conta.example/covers/videos/b.jpg?s=1' },
            ]);

            expect(repo).toHaveBeenCalledWith(9, [
                {
                    keep: 1,
                    url: 'https://conta.example/covers/videos/b.jpg?s=1',
                },
            ]);
        },
    );
});
