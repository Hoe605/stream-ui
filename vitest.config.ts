import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, defineConfig({
    test: {
        root: '.',
        environment: 'happy-dom',
        include: ['tests/**/*.{test,spec}.ts'],
        coverage: {
            provider: 'v8',
            enabled: false,
            thresholds: {
                branches: 100,
            },
        },
    },
}));
