import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiClinicPatientsRepository } from '@/infrastructure/repositories/api-clinic-patients';

// Mocka o módulo inteiro do apiClient
vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}));

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);

afterEach(() => {
    vi.clearAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeApiPatient(overrides = {}) {
    return {
        id: 1,
        name: 'Maria Silva',
        status: 'em_tratamento',
        photo_url: undefined,
        ...overrides,
    };
}

// ─── uploadPhoto ──────────────────────────────────────────────────────────────

describe('apiClinicPatientsRepository.uploadPhoto', () => {
    it('envia FormData com o arquivo para a rota correta', async () => {
        const apiPatient = makeApiPatient({
            photo_url: 'https://cdn.example.com/photo.jpg',
        });
        mockPost.mockResolvedValueOnce({ data: { data: apiPatient } });

        const file = new File(['conteudo'], 'photo.jpg', {
            type: 'image/jpeg',
        });
        await apiClinicPatientsRepository.uploadPhoto('42', file);

        expect(mockPost).toHaveBeenCalledOnce();

        const [url, body, config] = mockPost.mock.calls[0];
        expect(url).toBe('/clinic/patients/42/photo');
        expect(body).toBeInstanceOf(FormData);
        expect((body as FormData).get('photo')).toBe(file);
        expect(config).toMatchObject({
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    });

    it('mapeia photo_url da API para photoUrl na entidade', async () => {
        const cdnUrl = 'https://cdn.example.com/patients/photos/abc.jpg';
        mockPost.mockResolvedValueOnce({
            data: { data: makeApiPatient({ photo_url: cdnUrl }) },
        });

        const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
        const patient = await apiClinicPatientsRepository.uploadPhoto(
            '1',
            file,
        );

        expect(patient.photoUrl).toBe(cdnUrl);
    });

    it('retorna photoUrl undefined quando API não retorna photo_url', async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: makeApiPatient({ photo_url: undefined }) },
        });

        const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
        const patient = await apiClinicPatientsRepository.uploadPhoto(
            '1',
            file,
        );

        expect(patient.photoUrl).toBeUndefined();
    });

    it('propaga erro quando a requisição falha', async () => {
        mockPost.mockRejectedValueOnce(new Error('Network Error'));

        const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
        await expect(
            apiClinicPatientsRepository.uploadPhoto('1', file),
        ).rejects.toThrow('Network Error');
    });
});

// ─── toEntity (via getById) ───────────────────────────────────────────────────

describe('apiClinicPatientsRepository — mapper', () => {
    it('mapeia id para string', async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: makeApiPatient({ id: 99 }) },
        });
        const patient = await apiClinicPatientsRepository.getById('99');
        expect(patient.id).toBe('99');
    });

    it('gera initial com a primeira letra do nome em maiúsculo', async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: makeApiPatient({ name: 'ana souza' }) },
        });
        const patient = await apiClinicPatientsRepository.getById('1');
        expect(patient.initial).toBe('A');
    });

    it('usa em_tratamento como status padrão quando ausente', async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: makeApiPatient({ status: undefined }) },
        });
        const patient = await apiClinicPatientsRepository.getById('1');
        expect(patient.status).toBe('em_tratamento');
    });

    it('mapeia clinic_user.name para professional', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: makeApiPatient({
                    clinic_user: { id: 7, name: 'Dr. Ricardo Silva' },
                }),
            },
        });

        const patient = await apiClinicPatientsRepository.getById('1');

        expect(patient.professional).toBe('Dr. Ricardo Silva');
        expect(patient.professionalInitial).toBe('D');
    });

    it('mapeia diagnosis da API para a entidade', async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: makeApiPatient({ diagnosis: 'Lombalgia crônica' }) },
        });
        const patient = await apiClinicPatientsRepository.getById('1');
        expect(patient.diagnosis).toBe('Lombalgia crônica');
    });

    it('retorna diagnosis vazio quando ausente na API', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: makeApiPatient() } });
        const patient = await apiClinicPatientsRepository.getById('1');
        expect(patient.diagnosis).toBe('');
    });

    it('retorna professional vazio quando clinic_user ausente', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: makeApiPatient() } });

        const patient = await apiClinicPatientsRepository.getById('1');

        expect(patient.professional).toBe('');
        expect(patient.professionalInitial).toBe('');
    });

    it('traz apelido e o switch de usar apelido da listagem', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: makeApiPatient({
                    apelido: 'Aninha',
                    use_apelido: true,
                }),
            },
        });

        const patient = await apiClinicPatientsRepository.getById('1');

        expect(patient.apelido).toBe('Aninha');
        expect(patient.useApelido).toBe(true);
    });
});

// ─── create ───────────────────────────────────────────────────────────────────

describe('apiClinicPatientsRepository.create', () => {
    it('envia payload em snake_case para a API', async () => {
        mockPost.mockResolvedValueOnce({ data: { data: makeApiPatient() } });

        await apiClinicPatientsRepository.create({
            name: 'João',
            phone: '21999990000',
            birthDate: '1990-01-01',
            email: 'joao@teste.com',
            password: '123456',
            zipCode: '22041001',
            insuranceNumber: 'ABC123',
        });

        const payload = mockPost.mock.calls[0][1] as Record<string, unknown>;
        expect(payload).toMatchObject({
            name: 'João',
            phone: '21999990000',
            birth_date: '1990-01-01',
            email: 'joao@teste.com',
            zip_code: '22041001',
            insurance_number: 'ABC123',
        });
    });
});

// ─── situação (is_active) ─────────────────────────────────────────────────────

describe('apiClinicPatientsRepository: situação do paciente', () => {
    it('o cadastro não envia is_active (situação só muda pelos endpoints próprios)', async () => {
        mockPost.mockResolvedValueOnce({ data: { data: makeApiPatient() } });

        await apiClinicPatientsRepository.create({
            name: 'João',
            phone: '21999990000',
            birthDate: '1990-01-01',
            email: 'joao@teste.com',
            password: '123456',
        });

        const payload = mockPost.mock.calls[0][1] as Record<string, unknown>;
        expect(payload).not.toHaveProperty('is_active');
    });

    it('a edição não envia is_active', async () => {
        mockPut.mockResolvedValueOnce({ data: { data: makeApiPatient() } });

        await apiClinicPatientsRepository.update('1', { name: 'João' });

        const payload = mockPut.mock.calls[0][1] as Record<string, unknown>;
        expect(payload).not.toHaveProperty('is_active');
    });
});

describe('apiClinicPatientsRepository.list: situação', () => {
    function page(items: unknown[]) {
        return {
            data: {
                data: {
                    data: items,
                    total: items.length,
                    last_page: 1,
                    per_page: 15,
                    current_page: 1,
                },
            },
        };
    }

    it('mapeia is_active para isActive', async () => {
        mockGet.mockResolvedValueOnce(
            page([
                makeApiPatient({ id: 1, is_active: true }),
                makeApiPatient({ id: 2, is_active: false }),
            ]),
        );

        const result = await apiClinicPatientsRepository.list();

        expect(result.data.map((p) => p.isActive)).toEqual([true, false]);
    });

    it('sem is_active na resposta, o paciente conta como ativo', async () => {
        mockGet.mockResolvedValueOnce(page([makeApiPatient()]));

        const result = await apiClinicPatientsRepository.list();

        expect(result.data[0]?.isActive).toBe(true);
    });
});

describe('apiClinicPatientsRepository.reactivate', () => {
    it('chama POST /clinic/patients/{id}/reactivate e devolve o paciente ativo', async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: makeApiPatient({ id: 5, is_active: true }) },
        });

        const patient = await apiClinicPatientsRepository.reactivate('5');

        expect(mockPost).toHaveBeenCalledWith('/clinic/patients/5/reactivate');
        expect(patient).toMatchObject({ id: '5', isActive: true });
    });
});

describe('apiClinicPatientsRepository.bulkInactivate', () => {
    it('devolve quantos pacientes a API inativou', async () => {
        mockPost.mockResolvedValueOnce({ data: { message: 'ok', count: 0 } });

        await expect(
            apiClinicPatientsRepository.bulkInactivate(['9']),
        ).resolves.toBe(0);
        expect(mockPost).toHaveBeenCalledWith(
            '/clinic/patients/bulk-inactivate',
            { ids: [9] },
        );
    });
});
