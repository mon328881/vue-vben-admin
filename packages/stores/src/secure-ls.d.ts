declare module 'secure-ls' {
  export default class SecureLS {
    constructor(config?: {
      encodingType?: string;
      encryptionSecret?: string;
      isCompression?: boolean;
      metaKey?: string;
    });
    get(key: string): any;
    set(key: string, value: unknown): void;
  }
}
