import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ProgramListResult } from '@/application/clinic/ports';
import { listAllPatientPrograms } from '@/application/clinic/use-programs';
import type { Program } from '@/domain/clinic';
import { apiClinicProgramsRepository } from '@/infrastructure/repositories';

vi.mock('@/infrastructure/repositories', () => ({
    apiClinicProgramsRepository: { list: vi.fn() },
}));

const mockList = vi.mocked(apiClinicProgramsRepository.list);

afterEach(() => {
    vi.clearAllMocks();
});

function page(
    ids: string[],
    currentPage: number,
    lastPage: number,
): ProgramListResult {
    return {
        items: ids.map((id) => ({ id, patientId: '10' }) as Program),
        total: ids.length,
        lastPage,
        perPage: 20,
        currentPage,
    };
}

describe('listAllPatientPrograms', () => {
    it('com uma página, faz uma request filtrada pelo paciente', async () => {
        mockList.mockResolvedValueOnce(page(['1', '2'], 1, 1));

        const result = await listAllPatientPrograms('10');

        expect(mockList).toHaveBeenCalledTimes(1);
        expect(mockList).toHaveBeenCalledWith({
            patientId: '10',
            perPage: 20,
            page: 1,
        });
        expect(result.map((p) => p.id)).toEqual(['1', '2']);
    });

    it('pede as páginas seguintes sem aumentar per_page e junta sem repetir', async () => {
        mockList
            .mockResolvedValueOnce(page(['1', '2'], 1, 3))
            .mockResolvedValueOnce(page(['2', '3'], 2, 3))
            .mockResolvedValueOnce(page(['4'], 3, 3));

        const result = await listAllPatientPrograms('10');

        expect(mockList).toHaveBeenCalledTimes(3);
        expect(mockList).toHaveBeenNthCalledWith(2, {
            patientId: '10',
            perPage: 20,
            page: 2,
        });
        expect(mockList).toHaveBeenNthCalledWith(3, {
            patientId: '10',
            perPage: 20,
            page: 3,
        });
        expect(result.map((p) => p.id)).toEqual(['1', '2', '3', '4']);
    });
});
