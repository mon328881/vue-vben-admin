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
        // 超管端当前仅前端 UI + 本地 Mock，暂不代理后端
      },
    },
  };
});
