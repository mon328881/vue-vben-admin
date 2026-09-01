<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Alert,
  Badge,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tooltip,
  message,
} from 'ant-design-vue';

import {
  BOT_CHAT_BINDINGS_API_READY,
  BotChatBindingsApiNotReadyError,
  bindBotAdminChatApi,
  fetchBotChatBindingsApi,
  testBotChatBindingApi,
  unbindBotChatApi,
  type BotChatBindingItem,
  type BotChatBindingType,
} from '#/api/modules/bot';
import { copyText } from '#/utils/copy';

defineOptions({ name: 'RobotsChatBindingsTab' });

type TestStatus = 'error' | 'none' | 'ok' | 'testing';

interface BindingRow extends BotChatBindingItem {
  testStatus: TestStatus;
  testResult?: string;
}

const TYPE_NAME_MAP: Record<BotChatBindingType, string> = {
  admin: '管理群',
  merchant: '商户群',
  passage: '通道群',
};

const TYPE_COLOR_MAP: Record<BotChatBindingType, string> = {
  admin: 'purple',
  merchant: 'cyan',
  passage: 'orange',
};

const loading = ref(false);
/** 接口未就绪或请求失败时展示占位提示，且不再打真实请求 */
const apiUnavailable = ref(!BOT_CHAT_BINDINGS_API_READY);
const searchText = ref('');
const bindModalVisible = ref(false);
const bindChatId = ref('');
const bindTesting = ref(false);
const bindTestResult = ref<{
  ok: boolean;
  title?: string;
  error?: string;
} | null>(null);
const rows = ref<BindingRow[]>([]);
const pagination = reactive({ current: 1, pageSize: 10 });

const filteredRows = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  if (!keyword) return rows.value;
  return rows.value.filter((row) => {
    const haystack = [
      row.typeName,
      row.name,
      row.code,
      row.chatId,
      row.chatTitle,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(keyword);
  });
});

const tableRows = computed(() =>
  filteredRows.value.map((row) => ({
    ...row,
    rowKey: `${row.type}_${row.id}`,
  })),
);

const columns: TableColumnsType<BindingRow> = [
  { title: '绑定类型', dataIndex: 'typeName', width: 120 },
  { title: '群名称', dataIndex: 'chatTitle', ellipsis: true },
  { title: '主体标识', dataIndex: 'code', width: 160 },
  { title: 'Telegram 群 ID', dataIndex: 'chatId', width: 200 },
  { title: '检测状态', key: 'testStatus', width: 200 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
];

function typeLabel(row: BindingRow) {
  return row.typeName || TYPE_NAME_MAP[row.type];
}

function typeColor(type: BotChatBindingType) {
  return TYPE_COLOR_MAP[type] || 'blue';
}

function displayChatTitle(row: BindingRow) {
  return row.chatTitle || row.name || '—';
}

function normalizeRow(item: BotChatBindingItem): BindingRow {
  return {
    ...item,
    typeName: item.typeName || TYPE_NAME_MAP[item.type],
    testStatus: 'none',
  };
}

async function copyChatId(chatId: string) {
  if (chatId) await copyText(chatId, '群 ID');
}

async function fetchBindings() {
  if (!BOT_CHAT_BINDINGS_API_READY) {
    apiUnavailable.value = true;
    rows.value = [];
    return;
  }
  loading.value = true;
  apiUnavailable.value = false;
  try {
    const list = (await fetchBotChatBindingsApi()) ?? [];
    rows.value = list.map(normalizeRow);
  } catch (error) {
    apiUnavailable.value = true;
    rows.value = [];
    if (!(error instanceof BotChatBindingsApiNotReadyError)) {
      // 非「未就绪」错误已由 request 拦截器提示；此处仅兜底状态
    }
  } finally {
    loading.value = false;
  }
}

function patchRow(record: BindingRow, patch: Partial<BindingRow>) {
  rows.value = rows.value.map((row) =>
    row.id === record.id && row.type === record.type
      ? { ...row, ...patch }
      : row,
  );
}

function warnApiUnavailable() {
  message.warning('绑定群聊接口待后端对接');
}

async function handleTest(record: BindingRow) {
  if (apiUnavailable.value || !BOT_CHAT_BINDINGS_API_READY) {
    warnApiUnavailable();
    return;
  }
  patchRow(record, { testStatus: 'testing', testResult: undefined });
  try {
    const res = await testBotChatBindingApi({ chatId: record.chatId });
    if (res?.ok) {
      patchRow(record, {
        testStatus: 'ok',
        testResult: res.title || '群组正常',
      });
      return;
    }
    patchRow(record, {
      testStatus: 'error',
      testResult: res?.error || '检测失败，请确认机器人是否已加入该群组',
    });
  } catch {
    patchRow(record, {
      testStatus: 'error',
      testResult: '网络或接口异常',
    });
  }
}

async function handleTestAll() {
  if (!rows.value.length) return;
  if (apiUnavailable.value || !BOT_CHAT_BINDINGS_API_READY) {
    warnApiUnavailable();
    return;
  }
  await Promise.all(rows.value.map((row) => handleTest(row)));
}

async function handleUnbind(record: BindingRow) {
  if (apiUnavailable.value || !BOT_CHAT_BINDINGS_API_READY) {
    warnApiUnavailable();
    return;
  }
  try {
    const ok = await unbindBotChatApi({ id: record.id, type: record.type });
    if (ok) {
      message.success('解绑成功');
      await fetchBindings();
      return;
    }
    message.error('解绑失败');
  } catch {
    message.error('解绑失败');
  }
}

function openBindModal() {
  bindChatId.value = '';
  bindTestResult.value = null;
  bindModalVisible.value = true;
}

async function handleBindTest() {
  const chatId = bindChatId.value.trim();
  if (!chatId) {
    message.warning('请输入 Telegram 群 ID');
    return;
  }
  if (apiUnavailable.value || !BOT_CHAT_BINDINGS_API_READY) {
    warnApiUnavailable();
    return;
  }
  bindTesting.value = true;
  bindTestResult.value = null;
  try {
    const res = await testBotChatBindingApi({ chatId });
    if (res?.ok) {
      bindTestResult.value = { ok: true, title: res.title || '群组正常' };
      return;
    }
    bindTestResult.value = {
      ok: false,
      error: res?.error || '检测失败，请确认机器人是否已加入该群组',
    };
  } catch {
    bindTestResult.value = { ok: false, error: '网络或接口异常' };
  } finally {
    bindTesting.value = false;
  }
}

async function handleBindAdmin() {
  const chatId = bindChatId.value.trim();
  if (!chatId) {
    message.warning('请输入 Telegram 群 ID');
    return;
  }
  if (apiUnavailable.value || !BOT_CHAT_BINDINGS_API_READY) {
    warnApiUnavailable();
    return;
  }
  loading.value = true;
  try {
    const ok = await bindBotAdminChatApi({ chatId });
    if (ok) {
      message.success('绑定管理群成功');
      bindModalVisible.value = false;
      await fetchBindings();
      return;
    }
    message.error('绑定失败');
  } catch {
    message.error('绑定失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void fetchBindings();
});
</script>

<template>
  <div class="bindings-tab">
    <Alert
      v-if="apiUnavailable"
      type="info"
      show-icon
      class="bindings-tab__alert"
    >
      <template #message>
        绑定列表接口待后端对接。当前可在 Telegram 群内使用
        <strong>[绑定管理群]</strong>、<strong>[绑定商户 商户号]</strong>、<strong>[绑定通道 通道ID]</strong>
        等命令完成绑定；发送 <strong>[群ID]</strong> 可获取群 Chat ID。
      </template>
    </Alert>

    <div class="bindings-tab__toolbar">
      <Space wrap>
        <Input
          v-model:value="searchText"
          allow-clear
          placeholder="搜索群名称 / 标识 / 群 ID"
          class="bindings-tab__search"
          @change="pagination.current = 1"
        />
        <Button :loading="loading" @click="fetchBindings">刷新</Button>
      </Space>
      <Space wrap>
        <Button @click="openBindModal">绑定管理群</Button>
        <Button
          type="primary"
          :disabled="!filteredRows.length || apiUnavailable"
          @click="handleTestAll"
        >
          一键检测所有群聊
        </Button>
      </Space>
    </div>

    <Table
      row-key="rowKey"
      :columns="columns"
      :data-source="tableRows"
      :loading="loading"
      :pagination="{
        current: pagination.current,
        pageSize: pagination.pageSize,
        showSizeChanger: true,
        showTotal: (total: number) => `共 ${total} 个绑定群聊`,
        onChange: (page: number, size: number) => {
          pagination.current = page;
          pagination.pageSize = size;
        },
      }"
      :scroll="{ x: 960 }"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'typeName'">
          <Badge
            :color="typeColor(record.type)"
            :text="typeLabel(record as BindingRow)"
          />
        </template>
        <template v-else-if="column.dataIndex === 'chatTitle'">
          {{ displayChatTitle(record as BindingRow) }}
        </template>
        <template v-else-if="column.dataIndex === 'code'">
          <code v-if="record.code" class="bindings-table__code">
            {{ record.code }}
          </code>
          <span v-else>—</span>
        </template>
        <template v-else-if="column.dataIndex === 'chatId'">
          <a
            class="bindings-table__chat-id"
            @click="copyChatId(record.chatId as string)"
          >
            {{ record.chatId }}
          </a>
        </template>
        <template v-else-if="column.key === 'testStatus'">
          <span
            v-if="record.testStatus === 'testing'"
            class="bindings-status bindings-status--testing"
          >
            检测中…
          </span>
          <Tooltip
            v-else-if="record.testStatus === 'ok'"
            :title="record.testResult || '群组正常'"
          >
            <span class="bindings-status bindings-status--ok">
              正常
              <template v-if="record.testResult">
                （{{ record.testResult }}）
              </template>
            </span>
          </Tooltip>
          <Tooltip
            v-else-if="record.testStatus === 'error'"
            :title="record.testResult || '检测失败'"
          >
            <span class="bindings-status bindings-status--error">异常</span>
          </Tooltip>
          <span v-else class="bindings-status bindings-status--none">
            未检测
          </span>
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <a
              class="bindings-action"
              @click="handleTest(record as BindingRow)"
            >
              检测
            </a>
            <Popconfirm
              v-if="record.type !== 'admin'"
              :title="`确定解除该${typeLabel(record as BindingRow)}绑定吗？`"
              ok-text="确定"
              cancel-text="取消"
              :ok-button-props="{ danger: true }"
              @confirm="handleUnbind(record as BindingRow)"
            >
              <a class="bindings-action bindings-action--danger">解绑</a>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="bindModalVisible"
      title="绑定管理群"
      ok-text="确认绑定"
      cancel-text="取消"
      :confirm-loading="loading"
      destroy-on-close
      @ok="handleBindAdmin"
    >
      <Form layout="vertical" class="bindings-bind-form">
        <Form.Item label="Telegram 群 ID (Chat ID)" required>
          <Input
            v-model:value="bindChatId"
            placeholder="请先在该群发送 [群ID] 获取 Chat ID"
            allow-clear
          />
        </Form.Item>
        <Space>
          <Button :loading="bindTesting" @click="handleBindTest">
            检测群组
          </Button>
          <span v-if="bindTestResult?.ok" class="bindings-bind-form__ok">
            {{ bindTestResult.title || '群组正常' }}
          </span>
          <span
            v-else-if="bindTestResult && !bindTestResult.ok"
            class="bindings-bind-form__error"
          >
            {{ bindTestResult.error }}
          </span>
        </Space>
        <Alert
          type="warning"
          show-icon
          class="bindings-bind-form__hint"
          message="管理群唯一，用于接收预警与系统通知；也可在群内直接发送 [绑定管理群] 完成绑定。"
        />
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.bindings-tab__alert {
  margin-bottom: 16px;
}

.bindings-tab__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.bindings-tab__search {
  width: 260px;
}

.bindings-table__code {
  font-size: 12px;
  color: #c41d7f;
}

.bindings-table__chat-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}

.bindings-status {
  font-size: 13px;
}

.bindings-status--none {
  color: var(--ant-color-text-secondary, #8c8c8c);
}

.bindings-status--testing {
  color: #1890ff;
}

.bindings-status--ok {
  font-weight: 500;
  color: #52c41a;
}

.bindings-status--error {
  font-weight: 500;
  color: #ff4d4f;
}

.bindings-action--danger {
  color: #ff4d4f;
}

.bindings-bind-form {
  margin-top: 8px;
}

.bindings-bind-form__hint {
  margin-top: 16px;
}

.bindings-bind-form__ok {
  color: #52c41a;
}

.bindings-bind-form__error {
  color: #ff4d4f;
}
</style>
