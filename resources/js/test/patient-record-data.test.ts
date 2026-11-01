import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PatientQuestionnaire, Program } from '@/domain/clinic';
import {
    buildRecordItems,
    matchesSearch,
    tabFromSearchParam,
    type RecordItem,
} from '@/pages/clinic/patient/patient-record/data';

function item(
    kind: RecordItem['kind'],
    title: string,
    subtitle = '',
): RecordItem {
    return {
        key: `${kind}-1`,
        kind,
        date: new Date('2026-10-22T12:00:00'),
        title,
        subtitle,
        author: null,
        status: null,
        pending: false,
        future: false,
        source: { kind, item: {} },
    } as RecordItem;
}

describe('tabFromSearchParam', () => {
    it('aceita as quatro abas da B', () => {
        expect(tabFromSearchParam('clinico')).toBe('clinico');
        expect(tabFromSearchParam('agenda')).toBe('agenda');
        expect(tabFromSearchParam('programas')).toBe('programas');
        expect(tabFromSearchParam('arquivos')).toBe('arquivos');
    });

    it('tab da v1 ou valor inválido cai em Clínico', () => {
        expect(tabFromSearchParam('questionnaires')).toBe('clinico');
        expect(tabFromSearchParam('evolutions')).toBe('clinico');
        expect(tabFromSearchParam('foo')).toBe('clinico');
        expect(tabFromSearchParam(null)).toBe('clinico');
    });
});

describe('matchesSearch', () => {
    it('filtra evolução, avaliação, questionário e arquivo', () => {
        expect(matchesSearch(item('evolucao', 'Lombar aguda'), 'aguda')).toBe(
            true,
        );
        expect(matchesSearch(item('evolucao', 'Lombar aguda'), 'joelho')).toBe(
            false,
        );
        expect(
            matchesSearch(item('avaliacao', 'SF-36', 'Avaliação'), 'sf-36'),
        ).toBe(true);
        expect(matchesSearch(item('arquivo', 'raio-x.pdf'), 'raio')).toBe(true);
    });

    it('não esconde consulta nem programa', () => {
        expect(matchesSearch(item('consulta', 'Sessão'), 'xyz')).toBe(true);
        expect(matchesSearch(item('programa', 'Casa'), 'xyz')).toBe(true);
    });
});

describe('buildRecordItems', () => {
    const baseQuestionnaire = (
        patch: Partial<PatientQuestionnaire>,
    ): PatientQuestionnaire => ({
        id: 1,
        clinicId: 1,
        patientId: 1,
        clinicUserId: 1,
        questionnaireTemplateId: 1,
        modality: 'remoto',
        status: 'pending',
        publicToken: 'test-token',
        shareUrl: 'https://example.com/q',
        expiresAt: null,
        answeredAt: null,
        createdAt: '2026-10-23T12:00:00Z',
        template: { id: 1, title: 'QA Dor' },
        clinicUser: { id: 1, name: 'Cleverton' },
        ...patch,
    });

    it('questionário pendente não usa subtítulo de respondido', () => {
        const [row] = buildRecordItems({
            appointments: [],
            evolutions: [],
            assessments: [],
            questionnaires: [baseQuestionnaire({ status: 'pending' })],
            files: [],
            programs: [],
        });
        expect(row?.subtitle).toBe('Aguardando resposta do paciente');
        expect(row?.status?.label).toBe('Aguardando resposta');
    });

    it('questionário respondido distingue modalidade', () => {
        const [row] = buildRecordItems({
            appointments: [],
            evolutions: [],
            assessments: [],
            questionnaires: [
                baseQuestionnaire({
                    status: 'answered',
                    answeredAt: '2026-10-24T12:00:00Z',
                }),
            ],
            files: [],
            programs: [],
        });
        expect(row?.subtitle).toBe('Respondido pelo paciente, a distância');
    });

    it('evolução com modelo monta folha sem markdown na prévia', () => {
        const [row] = buildRecordItems({
            appointments: [],
            evolutions: [
                {
                    id: 9,
                    patientId: 1,
                    clinicUserId: 1,
                    evolutionTemplateId: 1,
                    title: 'Sessão',
                    generatedText: '**Conduta:** Alongamento — detalhe.',
                    notes: null,
                    checkedItems: [],
                    status: 'signed',
                    signedAt: '2026-10-23T12:00:00Z',
                    createdAt: '2026-10-23T12:00:00Z',
                },
            ],
            assessments: [],
            questionnaires: [],
            files: [],
            programs: [],
        });
        expect(row?.subtitle).not.toContain('**');
        expect(row?.evolutionSheet?.[0]?.section).toBe('Conduta');
    });
});

describe('buildRecordItems: data do programa no fuso de Brasília', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('mostra o programa no dia de início, sem voltar um dia', () => {
        vi.stubEnv('TZ', 'America/Sao_Paulo');
        const program = {
            id: '61',
            title: 'Programa em casa',
            patientId: '108',
            patientName: 'Paciente Teste',
            patientPhotoUrl: null,
            patientPhone: null,
            patientEmail: null,
            shareUrl: null,
            professionalId: '1',
            professionalName: 'Fisio Teste',
            professionalPhotoUrl: null,
            exerciseCount: 3,
            startDate: '2026-08-10',
            endDate: null,
            message: '',
            groups: [],
            status: 'active',
            patientViewedAt: null,
            patientCompletedCount: 0,
            createdAt: '2026-08-10T12:00:00Z',
        } satisfies Program;

        const [row] = buildRecordItems({
            appointments: [],
            evolutions: [],
            assessments: [],
            questionnaires: [],
            files: [],
            programs: [program],
        });

        expect(row?.date?.getDate()).toBe(10);
        expect(row?.date?.getMonth()).toBe(7);
    });
});
