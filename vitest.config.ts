import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/test/setup.ts'],
        // .claude: scripts das skills, testados com node:test e não com Vitest.
        exclude: [...configDefaults.exclude, '.claude/**'],
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
