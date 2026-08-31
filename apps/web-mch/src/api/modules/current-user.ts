import { requestClient } from '#/api/request';

import { encodeCredential } from '#/api/helper/credential';

export async function fetchGoogleKeyApi() {
  return requestClient.get<{ key?: string; qrCode?: string }>(
    '/current/getGoogleKey',
  );
}

export async function updateProfileApi(payload: {
  loginUsername?: string;
  sysUserId?: number;
  googleAuth: number;
  googleKey?: string;
  googleCode?: string;
}) {
  return requestClient.put('/current/user', payload);
}

export async function modifyPwdApi(payload: {
  recordId: number;
  originalPwd: string;
  confirmPwd: string;
}) {
  return requestClient.put('/current/modifyPwd', {
    recordId: payload.recordId,
    originalPwd: encodeCredential(payload.originalPwd),
    confirmPwd: encodeCredential(payload.confirmPwd),
  });
}
