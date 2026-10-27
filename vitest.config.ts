import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        // forks (processo): testes de fuso trocam TZ em tempo de execução,
        // e em worker_threads a troca é ignorada.
        pool: 'forks',
        setupFiles: ['./resources/js/test/setup.ts'],
        // Skills: scripts testados com node:test, não com Vitest.
        exclude: [
            ...configDefaults.exclude,
            '.claude/**',
            '.cursor/skills/**',
            '.agents/**',
        ],
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
