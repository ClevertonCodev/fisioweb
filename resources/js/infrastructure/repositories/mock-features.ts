import type { FeaturesRepository } from '@/application/admin/ports';
import type { Feature } from '@/domain/admin';

export const mockFeatures: Feature[] = [
    {
        id: 1,
        key: 'agenda',
        name: 'Agenda',
        valueIsolated: 10.0,
        type: 'bool',
    },
    {
        id: 2,
        key: 'programas_exercicios',
        name: 'Programas e Exercícios',
        valueIsolated: 15.0,
        type: 'bool',
    },
    {
        id: 3,
        key: 'financas',
        name: 'Finanças',
        valueIsolated: 5.0,
        type: 'bool',
    },
    {
        id: 4,
        key: 'app',
        name: 'App',
        valueIsolated: 20.0,
        type: 'bool',
    },
];

export const mockFeaturesRepository: FeaturesRepository = {
    async getCreateOptions() {
        return {
            allowed_keys: {
                agenda: 'Agenda',
                programas_exercicios: 'Programas e Exercícios',
                financas: 'Finanças',
                app: 'App',
            },
            available_keys: {},
            types: { bool: 'Ativa/Inativa', int: 'Quantidade' },
        };
    },
    async list() {
        return [...mockFeatures];
    },
    async getById(id) {
        return mockFeatures.find((f) => f.id === id) ?? null;
    },
    async create() {
        throw new Error('Use API repository');
    },
    async update() {
        throw new Error('Use API repository');
    },
    async destroy() {
        throw new Error('Use API repository');
    },
};
