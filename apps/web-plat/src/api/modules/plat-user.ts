import type { PlatUser } from '#/mock/types';

import { DEFAULT_OPERATOR_ENTS } from '#/constants/entitlements';
import { mockAuditLogs, mockPlatUsers } from '#/mock/data';
import { mockCurrentUser, requirePlatAdmin } from '#/mock/session';

function delay(ms = 160) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowStamp() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function requireAccount(userId: string) {
  const row = mockPlatUsers.find((item) => item.userId === userId);
  if (!row) throw new Error('账号不存在');
  return row;
}

function appendAudit(action: string, target: string, remark?: string) {
  mockAuditLogs.unshift({
    id: `a${Date.now()}`,
    createdAt: nowStamp(),
    operator: mockCurrentUser.loginUsername,
    module: 'plat-user',
    action,
    target,
    result: 'success',
    remark,
  });
}

export type { PlatUser };

export async function fetchPlatUsersApi(query?: { keyword?: string }) {
  await delay();
  requirePlatAdmin();
  const keyword = String(query?.keyword ?? '')
    .trim()
    .toLowerCase();
  let list = [...mockPlatUsers];
  if (keyword) {
    list = list.filter(
      (item) =>
        item.loginUsername.toLowerCase().includes(keyword) ||
        item.realname.toLowerCase().includes(keyword) ||
        String(item.telegram ?? '')
          .toLowerCase()
          .includes(keyword),
    );
  }
  return { records: list, total: list.length };
}

export async function savePlatUserApi(
  payload: Partial<PlatUser> & { loginUsername: string; realname: string },
) {
  await delay();
  requirePlatAdmin();
  const existing = mockPlatUsers.find((item) => item.userId === payload.userId);
  const nextAdmin = (payload.isAdmin ?? existing?.isAdmin ?? 0) as 0 | 1;
  if (existing && existing.isAdmin === 1 && nextAdmin === 0) {
    const otherSuper = mockPlatUsers.some(
      (item) => item.userId !== existing.userId && item.isAdmin === 1,
    );
    if (!otherSuper) {
      throw new Error('至少保留一个超管');
    }
  }
  const entIdList =
    nextAdmin === 1 ? [] : [...(payload.entIdList ?? DEFAULT_OPERATOR_ENTS)];
  if (existing) {
    Object.assign(existing, payload, {
      isAdmin: nextAdmin,
      entIdList,
      password: existing.password,
    });
    appendAudit('编辑管理账号', existing.loginUsername);
    return existing;
  }
  const created: PlatUser = {
    userId: `u${Date.now()}`,
    loginUsername: payload.loginUsername,
    realname: payload.realname,
    telegram: payload.telegram,
    state: payload.state ?? 1,
    isAdmin: nextAdmin,
    googleAuth: payload.googleAuth ?? 0,
    password: '123456',
    entIdList,
    createdAt: nowStamp(),
  };
  mockPlatUsers.unshift(created);
  appendAudit('新建管理账号', created.loginUsername);
  return created;
}

export async function resetPlatUserPasswordApi(userId: string, password: string) {
  await delay();
  requirePlatAdmin();
  const pwd = password.trim();
  if (pwd.length < 6 || pwd.length > 12) {
    throw new Error('新密码长度为 6-12 位');
  }
  const row = requireAccount(userId);
  row.password = pwd;
  appendAudit('重置密码', row.loginUsername);
  return true;
}

export async function resetPlatUserGoogleApi(userId: string) {
  await delay();
  requirePlatAdmin();
  const row = requireAccount(userId);
  row.googleAuth = 0;
  if (mockCurrentUser.loginUsername === row.loginUsername) {
    mockCurrentUser.googleAuth = 0;
  }
  appendAudit('重置谷歌密钥', row.loginUsername);
  return row;
}

export async function changeOwnPasswordApi(payload: {
  originalPwd: string;
  newPwd: string;
}) {
  await delay();
  const username = mockCurrentUser.loginUsername;
  const row = mockPlatUsers.find((item) => item.loginUsername === username);
  if (!row) throw new Error('账号不存在');
  if ((row.password ?? '123456') !== payload.originalPwd) {
    throw new Error('原密码不正确');
  }
  const pwd = payload.newPwd.trim();
  if (pwd.length < 6 || pwd.length > 12) {
    throw new Error('新密码长度为 6-12 位');
  }
  row.password = pwd;
  appendAudit('修改密码', row.loginUsername);
  return true;
}

let pendingGoogleKey = '';

function randomGoogleSecret() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  return Array.from(
    { length: 16 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]!,
  ).join('');
}

export async function fetchGoogleKeyApi() {
  await delay();
  const username = mockCurrentUser.loginUsername;
  const row = mockPlatUsers.find((item) => item.loginUsername === username);
  if (!row) throw new Error('账号不存在');
  if (row.googleAuth === 1) {
    throw new Error('已绑定谷歌验证器');
  }
  pendingGoogleKey = randomGoogleSecret();
  const qrCode = `otpauth://totp/AsiaPay:${encodeURIComponent(username)}?secret=${pendingGoogleKey}&issuer=AsiaPay`;
  return { key: pendingGoogleKey, qrCode };
}

export async function bindGoogleApi(payload: {
  googleCode: string;
  googleKey: string;
}) {
  await delay();
  const code = payload.googleCode.trim();
  if (!/^\d{6}$/.test(code)) {
    throw new Error('请输入 6 位谷歌验证码');
  }
  if (!payload.googleKey || payload.googleKey !== pendingGoogleKey) {
    throw new Error('绑定信息已失效，请关闭后重试');
  }
  const username = mockCurrentUser.loginUsername;
  const row = mockPlatUsers.find((item) => item.loginUsername === username);
  if (!row) throw new Error('账号不存在');
  row.googleAuth = 1;
  mockCurrentUser.googleAuth = 1;
  pendingGoogleKey = '';
  appendAudit('绑定谷歌验证器', row.loginUsername);
  return true;
}
