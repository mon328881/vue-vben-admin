import { message } from 'ant-design-vue';

function fallbackCopy(text: string) {
  try {
    const el = document.createElement('textarea');
    document.body.appendChild(el);
    el.style.position = 'fixed';
    el.style.clip = 'rect(0 0 0 0)';
    el.style.top = '10px';
    el.value = text;
    el.select();
    const ok = document.execCommand('copy', true);
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export async function copyRaw(text: string): Promise<boolean> {
  if (text == null || text === '') return false;
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => fallbackCopy(text),
    );
  }
  return fallbackCopy(text);
}

export async function copyText(text: string, label = '文本') {
  const value = text.replace(/\s+/g, ' ').trim();
  if (!value) return false;
  const ok = await copyRaw(value);
  if (ok) message.success(`已复制${label}`);
  else message.error('复制失败');
  return ok;
}
