import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiClinicPatientFilesRepository } from '@/infrastructure/repositories/api-clinic-patient-files';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockGet = vi.mocked(apiClient.get);

afterEach(() => {
    vi.clearAllMocks();
});

describe('apiClinicPatientFilesRepository', () => {
    it('pede as prévias de todas as imagens do paciente numa requisição só', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: [
                    {
                        file_id: 7,
                        url: 'https://r2.example/a.png?X-Amz-Signature=abc',
                        expires_at: '2026-10-12T09:05:00Z',
                    },
                ],
            },
        });

        const previews =
            await apiClinicPatientFilesRepository.listPreviews('108');

        expect(mockGet).toHaveBeenCalledWith(
            '/clinic/patients/108/files/previews',
        );
        expect(previews).toEqual([
            {
                fileId: 7,
                url: 'https://r2.example/a.png?X-Amz-Signature=abc',
                expiresAt: '2026-10-12T09:05:00Z',
            },
        ]);
    });

    it('pede o link assinado do arquivo na rota do paciente e mapeia o vencimento', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    url: 'https://r2.example/laudo.pdf?X-Amz-Signature=abc',
                    expires_at: '2026-10-12T09:05:00Z',
                },
            },
        });

        const link = await apiClinicPatientFilesRepository.getUrl('108', '51');

        expect(mockGet).toHaveBeenCalledWith(
            '/clinic/patients/108/files/51/url',
        );
        expect(link).toEqual({
            url: 'https://r2.example/laudo.pdf?X-Amz-Signature=abc',
            expiresAt: '2026-10-12T09:05:00Z',
        });
    });

    it('a listagem não carrega endereço do arquivo', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: [
                    {
                        id: 51,
                        patient_id: 108,
                        clinic_user_id: 5,
                        original_name: 'laudo.pdf',
                        name: 'Laudo',
                        mime_type: 'application/pdf',
                        size: 2048,
                        created_at: '2026-10-12T09:00:00',
                    },
                ],
            },
        });

        const [file] =
            await apiClinicPatientFilesRepository.listByPatient('108');

        expect(file).toEqual({
            id: 51,
            patientId: 108,
            clinicUserId: 5,
            clinicUser: undefined,
            originalName: 'laudo.pdf',
            name: 'Laudo',
            mimeType: 'application/pdf',
            size: 2048,
            createdAt: '2026-10-12T09:00:00',
        });
    });
});
