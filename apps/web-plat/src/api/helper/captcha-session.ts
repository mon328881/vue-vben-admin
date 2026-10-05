import { reactive } from 'vue';

/** 登录图形验证码 token（避免经 Vben Form componentProps 传递时引用丢失） */
export const loginCaptchaSession = reactive({
  token: '',
  expired: false,
});

let reloadFn: (() => Promise<void>) | null = null;

export function setLoginCaptchaToken(token: string) {
  loginCaptchaSession.token = token;
  loginCaptchaSession.expired = false;
}

export function markLoginCaptchaExpired() {
  loginCaptchaSession.expired = true;
}

export function clearLoginCaptchaToken() {
  loginCaptchaSession.token = '';
  loginCaptchaSession.expired = false;
}

export function registerLoginCaptchaReload(fn: () => Promise<void>) {
  reloadFn = fn;
}

export function reloadLoginCaptcha() {
  return reloadFn?.() ?? Promise.resolve();
}
