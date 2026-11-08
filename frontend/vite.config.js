import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@fb/shared': path.resolve(__dirname, '../shared/src/index.ts')
        }
    },
    server: {
        port: 5173,
        host: true
    }
});
