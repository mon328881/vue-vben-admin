import type { Pinia } from 'pinia';

import type { App } from 'vue';

import { createPinia, getActivePinia } from 'pinia';
import SecureLS from 'secure-ls';

let pinia: Pinia;

type SecureLSStorage = {
  get(key: string): any;
  set(key: string, value: unknown): void;
};

type SecureLSCtor = new (config?: {
  encodingType?: string;
  encryptionSecret?: string;
  isCompression?: boolean;
  metaKey?: string;
}) => SecureLSStorage;

const secureLSModule = SecureLS as unknown as {
  default?: SecureLSCtor;
  SecureLS?: SecureLSCtor;
};

const SecureLSConstructor =
  secureLSModule.default ??
  secureLSModule.SecureLS ??
  (SecureLS as unknown as SecureLSCtor);

export interface InitStoreOptions {
  /**
   * @zh_CN 应用名,由于 @vben/stores 是公用的，后续可能有多个app，为了防止多个app缓存冲突，可在这里配置应用名,应用名将被用于持久化的前缀
   */
  namespace: string;
}

/**
 * @zh_CN 初始化pinia
 */
export async function initStores(app: App, options: InitStoreOptions) {
  const { createPersistedState } = await import('pinia-plugin-persistedstate');
  pinia = createPinia();
  const { namespace } = options;
  const ls = new SecureLSConstructor({
    encodingType: 'aes',
    encryptionSecret: import.meta.env.VITE_APP_STORE_SECURE_KEY,
    isCompression: true,
    metaKey: `${namespace}-secure-meta`,
  });
  pinia.use(
    createPersistedState({
      // key $appName-$store.id
      key: (storeKey) => `${namespace}-${storeKey}`,
      storage: import.meta.env.DEV
        ? localStorage
        : {
            getItem(key) {
              return ls.get(key);
            },
            setItem(key, value) {
              ls.set(key, value);
            },
          },
    }),
  );
  app.use(pinia);
  return pinia;
}

export function resetAllStores(customPinia?: Pinia) {
  const currentPinia = customPinia ?? pinia ?? getActivePinia();
  if (!currentPinia) {
    console.error('Pinia is not installed');
    return;
  }
  const allStores = (currentPinia as any)._s;
  for (const [_key, store] of allStores) {
    store.$reset();
  }
}

/**
 * 跨标签页状态同步与注销广播监听器
 * 监听 storage 事件，当其他同源标签页登出（清空 token）时同步清空本标签页所有 store 状态
 */
export function setupCrossTabStorageSync(onLogout?: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (event: StorageEvent) => {
    // 当 localStorage.clear() (key===null) 或 access token/auth key 被清空时
    const isLogoutEvent =
      event.key === null ||
      (typeof event.key === 'string' &&
        (event.key.includes('access') || event.key.includes('auth')) &&
        (!event.newValue ||
          event.newValue === '""' ||
          event.newValue === 'null'));

    if (isLogoutEvent) {
      resetAllStores();
      onLogout?.();
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener('storage', handleStorage);
  };
}
