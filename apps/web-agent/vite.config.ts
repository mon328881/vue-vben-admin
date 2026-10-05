import { defineConfig } from '@vben/vite-config';

const securityHeaders = {
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
};

export default defineConfig(async (env) => {
  return {
    application: {},
    vite: {
      oxc:
        env?.mode === 'production'
          ? { drop: ['console', 'debugger'] }
          : undefined,
      preview: {
        headers: securityHeaders,
      },
      server: {
        headers: securityHeaders,
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
