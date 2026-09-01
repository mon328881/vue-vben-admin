<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Alert,
  Button,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Switch,
  Tabs,
  Textarea,
  message,
} from 'ant-design-vue';

import { fetchSysConfigsApi, updateSysConfigsApi } from '#/api';
import type { SysConfigItem } from '#/api/modules/system';
import RobotsChatBindingsTab from './components/RobotsChatBindingsTab.vue';

defineOptions({ name: 'RobotsConfigPage' });

const ADDRESS_DESC_KEY = 'addressDesc';
const ADDRESS_DESC_MAX = 300;
const MIN_SAVE_DELAY = 2000;
const PASSAGE_WARN_KEY = 'passageConfig';
const ROBOTS_USER_NAME_KEY = 'robotsUserName';
const ROBOTS_ADMIN_KEY = 'robotsAdmin';
const ROBOTS_TOKEN_KEY = 'robotsToken';
const WARN_KEYS = [
  'forceOrderWarnConfig',
  'errorOrderWarnConfig',
  PASSAGE_WARN_KEY,
];
const WALLET_KEYS = [
  'usdtOffset',
  'usdtAddress',
  'channelUserName',
  ADDRESS_DESC_KEY,
];
const THRESHOLD_WARN_KEYS = new Set([
  'forceOrderWarnConfig',
  'errorOrderWarnConfig',
]);
/** 关闭后再次打开时恢复的默认阈值 */
const DEFAULT_WARN_THRESHOLD = 1;

interface DocRow {
  dt: string;
  dd: string;
}
interface DocSection {
  heading: string;
  rows: DocRow[];
  note?: string;
}

const docSections: DocSection[] = [
  {
    heading: '基础',
    rows: [
      { dt: '群信息', dd: '格式 [群信息]，管理员/操作员发送，快捷查询当前群绑定信息。' },
      { dt: '群ID', dd: '格式 [群ID]，管理员/操作员发送，获取飞机群的群 ID。' },
    ],
  },
  {
    heading: '管理群与操作员',
    rows: [
      { dt: '绑定管理群', dd: '管理员发送；在不同群重复发送可换绑。管理群用于接收预警相关提醒。' },
      { dt: '设置操作员', dd: ' 格式 [设置操作员 @xxx]（如 设置操作员 @test，@ 后为用户名）。管理员发送；各群通用，只需设置一次。预付、记账需操作员权限。 ' },
      { dt: '删除操作员', dd: '格式 [删除操作员 @xxx]（如 删除操作员 @test）。管理员发送。' },
      { dt: '操作员名单', dd: '格式 [操作员名单]，管理员发送，查看操作员名单。' },
      { dt: '查询四方余额', dd: '格式 [查询四方余额]，管理员发送，查看系统余额。' },
    ],
  },
  {
    heading: '商户',
    rows: [
      { dt: '绑定商户', dd: ' 格式 [绑定商户 XXXXXXXX]（如 绑定商户 M10000000）。管理员/操作员发送，重复发送可换绑。 ' },
      { dt: '解绑商户', dd: ' 格式 [解绑商户 XXXXXXXX]（如 解绑商户 M10000000）。管理员/操作员发送。 ' },
      { dt: '全部商户', dd: '格式 [全部商户]，管理员/操作员发送，查询当前群绑定的商户。' },
      { dt: '解绑全部商户', dd: '格式 [解绑全部商户]，管理员/操作员发送，解绑当前群全部商户。' },
    ],
  },
  {
    heading: '供应商',
    rows: [
      { dt: '绑定供应商', dd: ' 格式 [绑定供应商 供应商名字]（如 绑定供应商 供应商1）。管理员/操作员发送，重复发送可换绑。 ' },
      { dt: '解绑供应商', dd: '格式 [解绑供应商]，管理员/操作员发送。' },
    ],
  },
  {
    heading: '通道',
    rows: [
      { dt: '绑定通道', dd: ' 格式 [绑定通道 通道ID]（如 绑定通道 1000 或 绑定通道 1000,2000,3000）。管理员/操作员发送，重复发送可换绑。 ' },
      { dt: '解绑通道', dd: '格式 [解绑通道 通道ID]（支持多个 ID，逗号分隔）。管理员/操作员发送。' },
      { dt: '全部通道', dd: '格式 [全部通道]，管理员/操作员发送，查看当前群绑定的通道。' },
      { dt: '解绑全部通道', dd: '格式 [解绑全部通道]，管理员/操作员发送。' },
    ],
  },
  {
    heading: '记账',
    note: '记账供群内临时记账使用，数据按群分开、仅保留当日记录，便于群内对账，不作为系统正式账务或财务凭证。 +/- 为预付（累加不清空），与临时记账不同；预付、记账、撤销、清除需管理员或操作员。适用于已绑定商户群或通道供应商群。 ',
    rows: [
      { dt: '添加预付', dd: '格式 [+金额]（如 +1000）。预付金额累加不清空。' },
      { dt: '扣减预付', dd: '格式 [-金额]（如 -1000）。' },
      { dt: '多商户预付', dd: ' 格式 [+金额 商户号]（如 +500 M1691231000）。群内绑定多个商户时使用。 ' },
      { dt: '记账', dd: ' 格式 [记账 金额]（如 记账 1000、记账 -1000）。群内临时记账，仅保留当日记录，隔日自动清理。 ' },
      { dt: '撤销记账', dd: '格式 [撤销记账]，删除最后一笔记账记录。管理员/操作员发送。' },
      { dt: '清除记账', dd: '格式 [清除记账]，删除当天全部记账记录。管理员/操作员发送。' },
      { dt: '今日账单', dd: '格式 [今日账单]，查看今日账单（预付与群内临时记账汇总）。' },
      { dt: '昨日账单', dd: '格式 [昨日账单]，查看昨日账单（含群内临时记账）。' },
    ],
  },
  {
    heading: '结算',
    rows: [
      { dt: '今日结算（群内）', dd: ' 格式 [今日结算]，在商户群或通道供应商群发送，查看当日结算信息。管理员/操作员发送；提示后可在 10 分钟内发送 [确认结算] 执行结算。 ' },
      { dt: '昨日结算（群内）', dd: '格式 [昨日结算]，查看昨日结算信息。管理员/操作员发送。' },
      { dt: '确认结算', dd: ' 格式 [确认结算]，在发送 [今日结算] 后于群内执行。管理员/操作员发送。 ' },
      { dt: '批量结算（私聊）', dd: ' 私聊机器人发送 [今日结算] 或 [昨日结算]，再回复该消息发送 [确认执行]，向所有商户群及供应商群推送结算消息。管理员/操作员操作。 ' },
    ],
  },
  {
    heading: '群发',
    rows: [
      { dt: '群发全部', dd: '格式 [群发全部]。先私发机器人内容，再回复该内容：群发全部。' },
      { dt: '群发商户', dd: '格式 [群发商户]，同上流程。' },
      { dt: '群发分组', dd: ' 格式 [群发分组 分组名称]（如 群发分组 测试分组）。同上流程，仅向该分组下的商户群发送。 ' },
      { dt: '群发通道', dd: '格式 [群发通道]，同上流程。' },
    ],
  },
  {
    heading: '其他',
    rows: [
      { dt: '删除', dd: '回复需删除的机器人消息。管理员/操作员发送，可删除机器人发出的消息。' },
    ],
  },
  {
    heading: '提醒名单',
    rows: [
      { dt: '设置提醒', dd: ' 格式 [设置提醒 @xxx]（如 设置提醒 @test）。管理员/操作员发送；每群单独设置，群发时对名单 @。 ' },
      { dt: '删除提醒', dd: '格式 [删除提醒 @xxx]，管理员/操作员发送。' },
      { dt: '查询提醒', dd: '格式 [查询提醒]，管理员/操作员发送。' },
      { dt: '删除全部提醒', dd: '格式 [删除全部提醒]，管理员/操作员发送。' },
      { dt: '所有人', dd: '格式 [所有人]，管理员/操作员发送，@ 已设置提醒的所有人。' },
    ],
  },
  {
    heading: '上浮与对接',
    rows: [
      { dt: '上浮', dd: '格式 [上浮 0.1]，设置当前群 U 价上浮比例（仅管理员/操作员）。' },
      { dt: '清除上浮', dd: '格式 [清除上浮]，清除群内已设置的上浮比例（仅管理员/操作员）。' },
      { dt: '对接信息', dd: ' 格式 [对接信息] 或 [对接资料]，管理员/操作员在商户群发送，自动下发开户对接资料。 ' },
      { dt: '设置费率', dd: ' 格式 [设置费率 1000/5.3]（产品编码/费率，如 5.3 表示 5.3%），支持多条：[设置费率 1000/5.3 1001/8.3]。多商户群可在前面加商户号，如 [设置费率 M1691231000 1000/5.3]；单商户群可省略商户号，未指定时对该群全部绑定商户生效。管理员或操作员在商户群发送：无商户产品记录则新建并绑定，已有记录则设为绑定并更新费率；不存在的产品编码会跳过。在通道供应商群发送时，与「修改费率」相同，按三方编码修改通道费率。 ' },
      { dt: '修改费率', dd: ' 格式 [修改费率 1000/5.3]，支持多条如 [修改费率 1000/5.3 1001/8.3]；多商户群可加商户号 [修改费率 M1691231000 1000/5.3]。管理员或操作员发送。在商户群：仅修改已绑定的商户产品费率；无记录或已解绑的产品会跳过，需改用「设置费率」。在通道供应商群：按三方编码修改通道费率。 ' },
    ],
  },
  {
    heading: '地址',
    rows: [
      { dt: 'udz', dd: '格式 [udz]，发出钱包地址。' },
      { dt: '地址', dd: '格式 [地址]，发出钱包地址。' },
      { dt: '地址统计', dd: '格式 [地址统计]，发出群组中所有 TRC20 地址统计信息。' },
    ],
  },
];

const DEFAULT_DOC_KEYS = ['基础', '管理群与操作员'];

const activeTab = ref('config');
const groupKey = ref('robotsConfigGroup');
const items = ref<SysConfigItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const loadError = ref(false);
const formModel = ref<Record<string, string>>({});
const accountModalVisible = ref(false);
const accountForm = ref({
  robotsAdmin: '',
  robotsToken: '',
  robotsUserName: '',
});
const docCollapseKeys = ref<string[]>([...DEFAULT_DOC_KEYS]);
/** 阈值预警关闭前暂存，便于再次打开时恢复 */
const warnThresholdCache = ref<Record<string, number>>({});

const warnItems = computed(() =>
  WARN_KEYS.map((key) => items.value.find((item) => item.configKey === key))
    .filter((item): item is SysConfigItem => item != null),
);

const walletItems = computed(() =>
  WALLET_KEYS.map((key) => items.value.find((item) => item.configKey === key))
    .filter((item): item is SysConfigItem => item != null),
);

const botUserName = computed(
  () => String(formModel.value[ROBOTS_USER_NAME_KEY] ?? '').trim(),
);

const botAdmin = computed(
  () => String(formModel.value[ROBOTS_ADMIN_KEY] ?? '').trim(),
);

const hasBotConfigured = computed(
  () => Boolean(botUserName.value || formModel.value[ROBOTS_TOKEN_KEY]),
);

const botTelegramHandle = computed(() => {
  const raw = botUserName.value.replace(/^@/, '');
  return raw ? `@${raw}` : '';
});

const botTelegramUrl = computed(() => {
  const raw = botUserName.value.replace(/^@/, '');
  return raw ? `https://t.me/${raw}` : '';
});

function isAddressDesc(item: SysConfigItem) {
  return item.configKey === ADDRESS_DESC_KEY;
}

function isThresholdWarnKey(key: string) {
  return THRESHOLD_WARN_KEYS.has(key);
}

function isWarnEnabled(key: string) {
  return Number(formModel.value[key] ?? 0) > 0;
}

function warnThreshold(key: string) {
  const num = Number(formModel.value[key] ?? 0);
  return num > 0 ? num : DEFAULT_WARN_THRESHOLD;
}

function onPassageWarnSwitch(checked: boolean | string | number, key: string) {
  formModel.value[key] = checked ? '1' : '0';
}

function onThresholdWarnSwitch(
  checked: boolean | string | number,
  key: string,
) {
  if (checked) {
    const cached = warnThresholdCache.value[key];
    const restored =
      cached && cached > 0 ? cached : DEFAULT_WARN_THRESHOLD;
    formModel.value[key] = String(restored);
    return;
  }
  const current = Number(formModel.value[key] ?? 0);
  if (current > 0) {
    warnThresholdCache.value[key] = current;
  }
  formModel.value[key] = '0';
}

function onThresholdWarnChange(value: null | number, key: string) {
  if (value == null || value < 1) return;
  formModel.value[key] = String(Math.floor(value));
  warnThresholdCache.value[key] = Math.floor(value);
}

function openAccountModal() {
  accountForm.value = {
    robotsAdmin: formModel.value[ROBOTS_ADMIN_KEY] ?? '',
    robotsToken: formModel.value[ROBOTS_TOKEN_KEY] ?? '',
    robotsUserName: formModel.value[ROBOTS_USER_NAME_KEY] ?? '',
  };
  accountModalVisible.value = true;
}

function applyAccountModal() {
  formModel.value[ROBOTS_ADMIN_KEY] = accountForm.value.robotsAdmin.trim();
  formModel.value[ROBOTS_TOKEN_KEY] = accountForm.value.robotsToken.trim();
  formModel.value[ROBOTS_USER_NAME_KEY] =
    accountForm.value.robotsUserName.trim();
  accountModalVisible.value = false;
}

async function load() {
  loadError.value = false;
  loading.value = true;
  items.value = [];
  try {
    const list = (await fetchSysConfigsApi(groupKey.value)) ?? [];
    items.value = list;
    const model: Record<string, string> = {};
    for (const item of list) {
      model[item.configKey] =
        item.configVal != null ? String(item.configVal) : '';
      if (isThresholdWarnKey(item.configKey)) {
        const num = Number(item.configVal ?? 0);
        if (num > 0) {
          warnThresholdCache.value[item.configKey] = num;
        }
      }
    }
    formModel.value = model;
    if (list[0]?.groupKey) {
      groupKey.value = list[0].groupKey;
    }
  } catch {
    loadError.value = true;
    message.error('加载配置失败');
  } finally {
    loading.value = false;
  }
}

function validate(): boolean {
  const desc = items.value.find(isAddressDesc);
  if (!desc) return true;
  const val = formModel.value[desc.configKey] ?? '';
  if (String(val).length > ADDRESS_DESC_MAX) {
    message.warning(
      `钱包自定义描述最多 ${ADDRESS_DESC_MAX} 个字符，请修改后再提交`,
    );
    return false;
  }
  return true;
}

async function submit() {
  if (!validate()) return;
  const formData = new FormData();
  for (const item of items.value) {
    formData.append(
      item.configKey,
      formModel.value[item.configKey] ?? '',
    );
  }
  saving.value = true;
  try {
    await Promise.all([
      new Promise<void>((resolve) => setTimeout(resolve, MIN_SAVE_DELAY)),
      updateSysConfigsApi(groupKey.value, formData),
    ]);
    message.success('修改成功');
    await load();
  } finally {
    saving.value = false;
  }
}

function confirmSubmit() {
  Modal.confirm({
    title: '确认修改',
    content: '确认修改机器人配置吗？',
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      try {
        await submit();
      } catch {
        // ignore — request layer already toasts
      }
    },
  });
}

onMounted(() => {
  void load();
});
</script>

<template>
  <Page auto-content-height title="机器人配置">
    <div v-if="loadError" class="robots-page__error">
      <Button type="primary" ghost @click="load">重新加载</Button>
    </div>

    <div v-else class="robots-page">
      <Row :gutter="[16, 16]">
        <!-- 左栏：Bot 名片 + 预警快捷区 -->
        <Col :xs="24" :lg="7" :xl="6">
          <div class="robots-sidebar">
            <div class="bot-profile-card">
              <div class="bot-profile-card__avatar" aria-hidden="true">
                <svg
                  class="bot-profile-card__icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                  />
                </svg>
              </div>

              <template v-if="hasBotConfigured">
                <h3 class="bot-profile-card__title">
                  {{ botUserName || '机器人' }}
                </h3>
                <a
                  v-if="botTelegramUrl"
                  :href="botTelegramUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="bot-profile-card__link"
                >
                  {{ botTelegramHandle }}
                </a>
                <p v-if="botAdmin" class="bot-profile-card__meta">
                  管理员 {{ botAdmin }}
                </p>
              </template>
              <template v-else>
                <h3 class="bot-profile-card__title bot-profile-card__title--muted">
                  未配置机器人
                </h3>
                <p class="bot-profile-card__hint">
                  配置 Token 与用户名后，机器人即可在群内响应命令
                </p>
              </template>

              <Button
                type="primary"
                ghost
                block
                class="bot-profile-card__btn"
                @click="openAccountModal"
              >
                配置机器人账号
              </Button>
            </div>

            <div v-if="warnItems.length" class="quick-warn-card">
              <h4 class="quick-warn-card__title">管理群预警</h4>
              <p class="quick-warn-card__desc">
                开启后，相关事件将推送到已绑定的管理群
              </p>

              <div
                v-for="item in warnItems"
                :key="item.configKey"
                class="quick-warn-row"
              >
                <div class="quick-warn-row__head">
                  <span class="quick-warn-row__label">
                    {{ item.configName }}
                  </span>
                  <div class="quick-warn-row__controls">
                    <Switch
                      v-if="item.configKey === PASSAGE_WARN_KEY"
                      :checked="formModel[item.configKey] === '1'"
                      checked-children="开"
                      un-checked-children="关"
                      size="small"
                      @change="
                        (checked) =>
                          onPassageWarnSwitch(checked, item.configKey)
                      "
                    />
                    <template v-else>
                      <Switch
                        :checked="isWarnEnabled(item.configKey)"
                        checked-children="开"
                        un-checked-children="关"
                        size="small"
                        @change="
                          (checked) =>
                            onThresholdWarnSwitch(checked, item.configKey)
                        "
                      />
                      <InputNumber
                        v-if="isWarnEnabled(item.configKey)"
                        :value="warnThreshold(item.configKey)"
                        :min="1"
                        :max="999999"
                        :precision="0"
                        size="small"
                        addon-after="笔"
                        class="quick-warn-row__threshold"
                        @change="
                          (value) =>
                            onThresholdWarnChange(value, item.configKey)
                        "
                      />
                    </template>
                  </div>
                </div>
                <p v-if="item.configDesc" class="quick-warn-row__help">
                  {{ item.configDesc }}
                </p>
              </div>
            </div>
          </div>
        </Col>

        <!-- 右栏：配置详情 + 使用说明 -->
        <Col :xs="24" :lg="17" :xl="18">
          <div class="robots-main-panel">
            <Tabs v-model:active-key="activeTab">
              <Tabs.TabPane key="config" tab="配置详情">
                <div v-if="loading" class="robots-main-panel__loading">
                  加载中…
                </div>
                <Form
                  v-else
                  layout="vertical"
                  class="config-form"
                >
                  <div class="config-section-head">
                    <h4 class="config-section-head__title">USDT 与钱包</h4>
                    <p class="config-section-head__desc">
                      汇率浮动、收款地址及 udz 命令展示文案
                    </p>
                  </div>

                  <Row :gutter="[24, 8]">
                    <Col
                      v-for="item in walletItems"
                      :key="item.configKey"
                      :span="isAddressDesc(item) ? 24 : 12"
                    >
                      <Form.Item
                        :label="item.configName"
                        :help="isAddressDesc(item) ? undefined : item.configDesc"
                      >
                        <Input
                          v-if="!isAddressDesc(item)"
                          v-model:value="formModel[item.configKey]"
                          allow-clear
                          autocomplete="off"
                        />
                        <template v-else>
                          <Textarea
                            v-model:value="formModel[item.configKey]"
                            :maxlength="ADDRESS_DESC_MAX"
                            show-count
                            :auto-size="{ minRows: 3, maxRows: 24 }"
                            :placeholder="`请输入钱包自定义描述，最多 ${ADDRESS_DESC_MAX} 个字符；留空时使用默认内容`"
                          />
                          <div class="config-description">
                            用于 udz（地址）命令的钱包说明，最多
                            {{ ADDRESS_DESC_MAX }} 个字符；留空时使用默认内容。
                          </div>
                        </template>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Tabs.TabPane>

              <Tabs.TabPane key="bindings" tab="绑定群聊">
                <RobotsChatBindingsTab />
              </Tabs.TabPane>

              <Tabs.TabPane key="help" tab="使用说明">
                <div class="robots-doc">
                  <Alert type="info" show-icon class="robots-doc__alert">
                    <template #message>
                      <div class="robots-doc__alert-content">
                        <p>
                          优先绑定<strong>管理群</strong>，用于接收预警、提示等。管理群、商户群、通道群每个群只能同时绑定一种类型，<strong>管理群唯一</strong>。
                        </p>
                        <p>
                          本页包含四方工作人员命令及<strong>记账、结算</strong>说明；群内用户常用查询命令请发送
                          <span class="robots-doc__help-tag">/help</span>
                          查看。
                        </p>
                      </div>
                    </template>
                  </Alert>

                  <Collapse
                    v-model:active-key="docCollapseKeys"
                    class="robots-doc__collapse"
                    :bordered="false"
                  >
                    <Collapse.Panel
                      v-for="sec in docSections"
                      :key="sec.heading"
                      :header="sec.heading"
                    >
                      <p v-if="sec.note" class="robots-doc__note">
                        {{ sec.note }}
                      </p>
                      <ul class="robots-doc__cmd-list">
                        <li
                          v-for="row in sec.rows"
                          :key="row.dt"
                          class="robots-doc__cmd-item"
                        >
                          <span class="robots-doc__cmd-name">{{ row.dt }}</span>
                          <span class="robots-doc__cmd-desc">{{ row.dd }}</span>
                        </li>
                      </ul>
                    </Collapse.Panel>
                  </Collapse>
                </div>
              </Tabs.TabPane>
            </Tabs>

            <div class="robots-main-panel__footer">
              <Button
                type="primary"
                :loading="saving"
                :disabled="loading"
                @click="confirmSubmit"
              >
                确认更新
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </div>

    <Modal
      v-model:open="accountModalVisible"
      title="配置机器人账号"
      ok-text="确定"
      cancel-text="取消"
      :width="520"
      destroy-on-close
      @ok="applyAccountModal"
    >
      <Form layout="vertical" class="account-modal-form">
        <Form.Item label="机器人管理员">
          <Input
            v-model:value="accountForm.robotsAdmin"
            allow-clear
            placeholder="飞机用户名，不要 @"
            autocomplete="off"
          />
        </Form.Item>
        <Form.Item label="机器人 Token">
          <Input.Password
            v-model:value="accountForm.robotsToken"
            placeholder="由 @BotFather 颁发的 Bot Token"
            autocomplete="new-password"
          />
        </Form.Item>
        <Form.Item label="机器人用户名">
          <Input
            v-model:value="accountForm.robotsUserName"
            allow-clear
            placeholder="不要 @，勿乱动"
            autocomplete="off"
          />
        </Form.Item>
        <Alert
          type="warning"
          show-icon
          message="修改 Token 或用户名可能导致机器人失效，请谨慎操作。"
        />
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.robots-page__error {
  padding: 48px 0;
  text-align: center;
}

.robots-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bot-profile-card,
.quick-warn-card,
.robots-main-panel {
  background: var(--ant-color-bg-container, #fff);
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 2%);
}

.bot-profile-card {
  padding: 24px;
  text-align: center;
}

.bot-profile-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #2aabee 0%, #229ed9 100%);
  border-radius: 50%;
  box-shadow: 0 4px 10px rgb(34 158 217 / 25%);
}

.bot-profile-card__icon {
  width: 32px;
  height: 32px;
  color: #fff;
  transform: rotate(-30deg) translate(2px, -2px);
}

.bot-profile-card__title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}

.bot-profile-card__title--muted {
  font-size: 16px;
  font-weight: 500;
  color: var(--ant-color-text-secondary, #8c8c8c);
}

.bot-profile-card__link {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #229ed9;
}

.bot-profile-card__meta,
.bot-profile-card__hint {
  margin: 0 0 16px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ant-color-text-secondary, #8c8c8c);
}

.bot-profile-card__btn {
  border-radius: 6px;
}

.quick-warn-card {
  padding: 20px;
}

.quick-warn-card__title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
}

.quick-warn-card__desc {
  margin: 0 0 16px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ant-color-text-secondary, #8c8c8c);
}

.quick-warn-row + .quick-warn-row {
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--ant-color-border-secondary, #f0f0f0);
}

.quick-warn-row__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.quick-warn-row__label {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 22px;
  color: var(--ant-color-text, #595959);
}

.quick-warn-row__controls {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
}

.quick-warn-row__threshold {
  width: 96px;
}

.quick-warn-row__help {
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--ant-color-text-secondary, #8c8c8c);
}

.robots-main-panel {
  display: flex;
  flex-direction: column;
  min-height: 480px;
  padding: 24px;
}

.robots-main-panel :deep(.ant-tabs) {
  flex: 1;
}

.robots-main-panel__loading {
  padding: 32px 0;
  color: var(--ant-color-text-secondary, #8c8c8c);
  text-align: center;
}

.robots-main-panel__footer {
  position: sticky;
  bottom: 0;
  z-index: 1;
  padding-top: 16px;
  margin-top: 16px;
  background: var(--ant-color-bg-container, #fff);
  border-top: 1px solid var(--ant-color-border-secondary, #f0f0f0);
}

.config-section-head {
  margin-bottom: 16px;
}

.config-section-head__title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
}

.config-section-head__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ant-color-text-secondary, #8c8c8c);
}

.config-description {
  margin-top: 6px;
  font-size: 12px;
  color: var(--ant-color-text-secondary, #8c8c8c);
}

.account-modal-form {
  margin-top: 8px;
}

.robots-doc__alert {
  margin-bottom: 16px;
}

.robots-doc__alert-content p {
  margin: 0;
  line-height: 1.8;
}

.robots-doc__alert-content p + p {
  margin-top: 4px;
}

.robots-doc__help-tag {
  display: inline-block;
  padding: 0 6px;
  margin: 0 2px;
  font-size: 12px;
  line-height: 20px;
  color: #cf1322;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  border-radius: 4px;
}

.robots-doc__collapse :deep(.ant-collapse-item) {
  margin-bottom: 8px;
  overflow: hidden;
  background: var(--ant-color-fill-quaternary, #fafafa);
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0) !important;
  border-radius: 8px !important;
}

.robots-doc__collapse :deep(.ant-collapse-header) {
  font-weight: 600;
}

.robots-doc__note {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--ant-color-text-secondary, #6b7280);
}

.robots-doc__cmd-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.robots-doc__cmd-item {
  padding: 10px 12px;
  background: var(--ant-color-bg-container, #fff);
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: 8px;
}

.robots-doc__cmd-item + .robots-doc__cmd-item {
  margin-top: 8px;
}

.robots-doc__cmd-name {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #229ed9;
}

.robots-doc__cmd-desc {
  display: block;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ant-color-text-secondary, #8c8c8c);
}
</style>
