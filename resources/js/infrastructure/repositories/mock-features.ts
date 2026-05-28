import type { FeaturesRepository } from '@/application/admin/ports';
import type { Feature } from '@/domain/admin';

export const mockFeatures: Feature[] = [
    { id: 1, key: 'video_call', name: 'Vídeo', valueIsolated: 10.0, type: 'bool' },
    { id: 2, key: 'ai_assistant', name: 'Assistente IA', valueIsolated: 25.0, type: 'bool' },
    {
        id: 3,
        key: 'custom_exercises',
        name: 'Exercícios Personalizados',
        valueIsolated: null,
        type: 'int',
    },
];

export const mockFeaturesRepository: FeaturesRepository = {
    async getCreateOptions() {
        return {
            allowed_keys: {
                video_call: 'Vídeo',
                ai_assistant: 'Assistente IA',
                custom_exercises: 'Exercícios Personalizados',
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
