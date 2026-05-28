import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/test/setup.ts'],
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
