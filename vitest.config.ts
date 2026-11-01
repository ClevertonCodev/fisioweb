import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
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
