import { requestClient } from '#/api/request';

/** 群聊绑定类型（与 bot_chat.chat_type 语义对齐，供后续 mgr-api 对接） */
export type BotChatBindingType = 'admin' | 'merchant' | 'passage';

export interface BotChatBindingItem {
  id: number | string;
  type: BotChatBindingType;
  /** 展示用类型名，如「管理群」「商户群」 */
  typeName?: string;
  /** 主体名称（商户名、通道名、群标题等） */
  name?: string;
  /** 主体标识（商户号、通道 ID 等） */
  code?: string;
  chatId: string;
  chatTitle?: string;
}

export interface BotChatTestResult {
  ok?: boolean;
  title?: string;
  error?: string;
}

/**
 * mgr-api 尚未提供 `/bot/chats/*`。
 * 未就绪时禁止真实请求，避免未知路径返回 401 触发全局登出。
 * 后端对接完成后改为 `true`。
 */
export const BOT_CHAT_BINDINGS_API_READY = false;

export class BotChatBindingsApiNotReadyError extends Error {
  constructor(message = '绑定群聊接口待后端对接') {
    super(message);
    this.name = 'BotChatBindingsApiNotReadyError';
  }
}

function assertApiReady() {
  if (!BOT_CHAT_BINDINGS_API_READY) {
    throw new BotChatBindingsApiNotReadyError();
  }
}

/** 绑定群聊列表（接口待 mgr-api 实现） */
export async function fetchBotChatBindingsApi() {
  assertApiReady();
  return requestClient.get<BotChatBindingItem[]>('/bot/chats/bindings');
}

/** 检测群聊是否可用（接口待 mgr-api 实现） */
export async function testBotChatBindingApi(payload: { chatId: string }) {
  assertApiReady();
  return requestClient.post<BotChatTestResult>('/bot/chats/test', payload);
}

/** 解除群聊绑定（接口待 mgr-api 实现） */
export async function unbindBotChatApi(payload: {
  id: number | string;
  type: BotChatBindingType;
}) {
  assertApiReady();
  return requestClient.post<boolean>('/bot/chats/unbind', payload);
}

/** 后台绑定管理群（接口待 mgr-api 实现；群内亦可用 [绑定管理群]） */
export async function bindBotAdminChatApi(payload: { chatId: string }) {
  assertApiReady();
  return requestClient.post<boolean>('/bot/chats/bindAdmin', payload);
}
