import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            'stream-ui': resolve(__dirname, 'src/index.ts'),
        },
    },
    root: resolve(__dirname, 'play'),
    build: {
        outDir: resolve(__dirname, 'dist'),
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'StreamUI',
            fileName: 'stream-ui',
        },
        rollupOptions: {
            external: ['vue'],
            output: { globals: { vue: 'Vue' } }
        },
    },
});