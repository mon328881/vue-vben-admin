import { mockPlatConfig, mockPlatUsers } from '#/mock/data';
import { applyPlatSession, mockCurrentUser } from '#/mock/session';

export namespace AuthApi {
  export interface LoginParams {
    username: string;
    password: string;
    vercode?: string;
    vercodeToken?: string;
    google?: string;
  }

  export interface LoginResult {
    accessToken: string;
  }
}

let mockCaptcha = { token: '', code: '' };

function buildCaptchaSvg(code: string) {
  const noise = Array.from({ length: 5 }, (_, i) => {
    const x1 = 8 + i * 22;
    const y1 = 6 + ((i * 13) % 18);
    const x2 = 28 + i * 18;
    const y2 = 28 - ((i * 9) % 16);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#94a3b8" stroke-width="1"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="40" viewBox="0 0 150 40"><rect width="150" height="40" fill="#f1f5f9"/>${noise}<text x="18" y="28" font-family="ui-monospace,monospace" font-size="22" letter-spacing="10" fill="#1e293b">${code}</text></svg>`;
}

/** 获取站点标题（Mock） */
export async function getTitleApi() {
  return mockPlatConfig.platformName;
}

/** 图形验证码（Mock SVG，与运营/代理端字段对齐） */
export async function getVercodeApi() {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const token = `mock-vercode-${Date.now()}`;
  mockCaptcha = { token, code };
  const svg = buildCaptchaSvg(code);
  return {
    imageBase64Data: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    vercodeToken: token,
    expireTime: 60,
  };
}

/** 登录 Mock：账号密码 + 图形验证码；谷歌码与其它门户一致为可选 */
export async function loginApi(data: AuthApi.LoginParams) {
  const username = String(data.username ?? '').trim();
  if (!username) {
    throw new Error('请输入用户名');
  }
  if (!String(data.password ?? '').trim()) {
    throw new Error('请输入密码');
  }
  const vercode = String(data.vercode ?? '').trim();
  if (vercode !== mockCaptcha.code || data.vercodeToken !== mockCaptcha.token) {
    throw new Error('验证码错误');
  }
  const account = mockPlatUsers.find((item) => item.loginUsername === username);
  if (!account) {
    throw new Error('账号不存在');
  }
  if (account.state !== 1) {
    throw new Error('账号已停用');
  }
  const password = String(data.password ?? '');
  if ((account.password ?? '123456') !== password) {
    throw new Error('账号或密码错误');
  }
  const google = String(data.google ?? '').trim();
  if (account.googleAuth === 1 && !/^\d{6}$/.test(google)) {
    throw new Error('该账号已绑定谷歌验证，请输入6位验证码');
  }
  if (google && !/^\d{6}$/.test(google)) {
    throw new Error('谷歌验证码须为6位数字');
  }
  applyPlatSession(account);
  return {
    accessToken: `mock-plat-token-${username}`,
  } satisfies AuthApi.LoginResult;
}

export async function logoutApi(_token?: null | string) {
  return true;
}

export async function getAccessCodesApi(): Promise<string[]> {
  return [...(mockCurrentUser.entIdList ?? [])];
}

export async function refreshTokenApi(): Promise<{
  data: string;
  status: number;
}> {
  return { data: '', status: 501 };
}
