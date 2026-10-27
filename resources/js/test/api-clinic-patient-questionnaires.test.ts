import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiClinicPatientQuestionnairesRepository } from '@/infrastructure/repositories/api-clinic-patient-questionnaires';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockPost = vi.mocked(apiClient.post);

afterEach(() => {
    vi.clearAllMocks();
});

function makeApiQuestionnaire(overrides = {}) {
    return {
        id: 11,
        clinic_id: 1,
        patient_id: 102,
        clinic_user_id: 5,
        questionnaire_template_id: 3,
        status: 'answered',
        modality: 'presencial',
        answered_at: '2026-07-18T12:00:00Z',
        expires_at: null,
        public_token: '11111111-2222-3333-4444-555555555555',
        share_url:
            'http://localhost/clinica-demo/paciente/questionarios/11111111-2222-3333-4444-555555555555',
        created_at: '2026-07-17T12:00:00Z',
        ...overrides,
    };
}

describe('apiClinicPatientQuestionnairesRepository.answer', () => {
    it('envia answers com question_id snake_case na rota da clínica', async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: makeApiQuestionnaire() },
        });

        const result = await apiClinicPatientQuestionnairesRepository.answer(
            '102',
            '11',
            [{ questionId: 9, answer: 'Dor lombar' }],
        );

        const [url, body] = mockPost.mock.calls[0];
        expect(url).toBe('/clinic/patients/102/questionnaires/11/answer');
        expect(body).toEqual({
            answers: [{ question_id: 9, answer: 'Dor lombar' }],
        });
        expect(result).toMatchObject({
            id: 11,
            patientId: 102,
            status: 'answered',
            modality: 'presencial',
        });
    });
});

describe('apiClinicPatientQuestionnairesRepository.store', () => {
    it('mapeia public_token e share_url para camelCase', async () => {
        mockPost.mockResolvedValueOnce({
            data: {
                data: makeApiQuestionnaire({
                    status: 'pending',
                    answered_at: null,
                    modality: 'remoto',
                }),
            },
        });

        const result = await apiClinicPatientQuestionnairesRepository.store(
            '102',
            {
                questionnaireTemplateId: 3,
                modality: 'remoto',
                expiresAt: null,
            },
        );

        expect(result.publicToken).toBe('11111111-2222-3333-4444-555555555555');
        expect(result.shareUrl).toBe(
            'http://localhost/clinica-demo/paciente/questionarios/11111111-2222-3333-4444-555555555555',
        );
    });

    it('converte DTO camelCase em payload snake_case', async () => {
        mockPost.mockResolvedValueOnce({
            data: {
                data: makeApiQuestionnaire({
                    status: 'pending',
                    answered_at: null,
                    modality: 'remoto',
                    expires_at: '2026-07-20 18:00:00',
                }),
            },
        });

        await apiClinicPatientQuestionnairesRepository.store('102', {
            questionnaireTemplateId: 3,
            modality: 'remoto',
            expiresAt: '2026-07-20 18:00:00',
        });

        const [url, body] = mockPost.mock.calls[0];
        expect(url).toBe('/clinic/patients/102/questionnaires');
        expect(body).toEqual({
            questionnaire_template_id: 3,
            modality: 'remoto',
            expires_at: '2026-07-20 18:00:00',
        });
    });
});
