import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            // Diamond agent-api：保留 /api 前缀；去掉 Origin，避免后端 CORS 白名单未含新端口时 403
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                proxyReq.removeHeader('origin');
              });
            },
            target: 'http://localhost:8083',
            ws: true,
          },
        },
      },
    },
  };
});
