import { encodeCredential } from '#/api/helper/credential';
import { requestClient } from '#/api/request';

export async function fetchGoogleKeyApi() {
  return requestClient.get<{ key?: string; qrCode?: string }>(
    '/current/getGoogleKey',
  );
}

export async function bindGoogleApi(payload: {
  googleCode: string;
  googleKey: string;
}) {
  return requestClient.put('/current/bindGoogle', payload);
}

export async function modifyPasswordApi(
  recordId: number,
  originalPwd: string,
  confirmPwd: string,
) {
  return requestClient.put('/current/modifyPwd', {
    recordId,
    originalPwd: encodeCredential(originalPwd),
    confirmPwd: encodeCredential(confirmPwd),
  });
}
