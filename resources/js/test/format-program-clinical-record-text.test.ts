import { describe, expect, it } from 'vitest';

import { formatProgramClinicalRecordText } from '@/application/clinic/format-program-clinical-record-text';
import type { Program } from '@/domain/clinic';

function makeProgram(overrides: Partial<Program> = {}): Program {
    return {
        id: '1',
        title: 'Programa teste',
        patientId: '10',
        patientName: 'Ana',
        patientPhotoUrl: null,
        patientPhone: null,
        patientEmail: null,
        shareUrl: null,
        professionalId: '2',
        professionalName: 'Dr. Silva',
        professionalPhotoUrl: null,
        exerciseCount: 2,
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        message: '',
        groups: [],
        status: 'active',
        patientViewedAt: null,
        patientCompletedCount: 0,
        createdAt: '2026-01-01T10:00:00.000Z',
        ...overrides,
    };
}

describe('formatProgramClinicalRecordText', () => {
    it('formata grupos e exercícios no padrão do prontuário', () => {
        const text = formatProgramClinicalRecordText(
            makeProgram({
                groups: [
                    {
                        id: 'g1',
                        name: 'New Group',
                        exercises: [
                            {
                                id: 'e1',
                                exerciseId: '1',
                                title: 'Bicicleta ergométrica I',
                                thumbnailUrl: '',
                                videoUrl: '',
                                days: [1, 3, 5],
                                period: null,
                                seriesMin: null,
                                seriesMax: null,
                                restTime: 120,
                                notes: null,
                                isConfigured: true,
                            },
                            {
                                id: 'e2',
                                exerciseId: '2',
                                title: 'Cadeira flexora',
                                thumbnailUrl: '',
                                videoUrl: '',
                                days: [1, 3, 5],
                                period: null,
                                seriesMin: 3,
                                seriesMax: 3,
                                repetitionsMin: 12,
                                repetitionsMax: 15,
                                restTime: 30,
                                notes: 'não ultrapassar a angulação',
                                isConfigured: true,
                            },
                        ],
                    },
                ],
            }),
        );

        expect(text).toBe(
            [
                'New Group',
                '',
                'Bicicleta ergométrica I',
                'Frequência: 3x/semana, descansar por 120 seg',
                '',
                'Cadeira flexora',
                'Frequência: 3x/semana, 3 séries, de 12 a 15 repetições, descansar por 30 seg, orientações adicionais: não ultrapassar a angulação',
            ].join('\n'),
        );
    });

    it('retorna string vazia quando não há grupos', () => {
        expect(formatProgramClinicalRecordText(makeProgram())).toBe('');
    });
});
