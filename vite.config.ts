import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/openai': {
            target: env.OPENAI_BASE_URL || 'https://api.openai.com',
            changeOrigin: true,
            secure: !(env.OPENAI_BASE_URL && env.OPENAI_BASE_URL.startsWith('http://')),
            rewrite: (path) => path.replace(/^\/api\/openai/, '')
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.OPENAI_BASE_URL': JSON.stringify(env.OPENAI_BASE_URL),
        'process.env.OPENAI_MODEL': JSON.stringify(env.OPENAI_MODEL),
        'process.env.OPENAI_PROXY_PATH': JSON.stringify(env.OPENAI_PROXY_PATH || '/api/openai')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
