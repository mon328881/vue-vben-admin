<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
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

defineOptions({ name: 'RobotsConfigPage' });

const ADDRESS_DESC_KEY = 'addressDesc';
const ADDRESS_DESC_MAX = 300;
const MIN_SAVE_DELAY = 2000;
const PASSAGE_WARN_KEY = 'passageConfig';
const THRESHOLD_WARN_KEYS = new Set([
  'forceOrderWarnConfig',
  'errorOrderWarnConfig',
]);
const SWITCH_WARN_KEYS = new Set([
  PASSAGE_WARN_KEY,
  ...THRESHOLD_WARN_KEYS,
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

const activeTab = ref('help');
const groupKey = ref('robotsConfigGroup');
const items = ref<SysConfigItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const loadError = ref(false);
const formModel = ref<Record<string, string>>({});
/** 阈值预警关闭前暂存，便于再次打开时恢复 */
const warnThresholdCache = ref<Record<string, number>>({});

function isAddressDesc(item: SysConfigItem) {
  return item.configKey === ADDRESS_DESC_KEY;
}

function isSwitchWarn(item: SysConfigItem) {
  return SWITCH_WARN_KEYS.has(item.configKey);
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

function onTabChange(key: string | number) {
  activeTab.value = String(key);
  if (activeTab.value === 'config') {
    void load();
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
</script>

<template>
  <Page auto-content-height title="机器人配置">
    <Card :loading="loading && activeTab === 'config'">
      <Tabs :active-key="activeTab" @change="onTabChange">
        <Tabs.TabPane key="help" tab="机器人帮助说明" :force-render="true">
          <div class="robots-doc">
            <div class="robots-doc__head">
              <h3 class="robots-doc__heading">机器人帮助说明</h3>
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
              <Divider orientation="left" class="robots-doc__divider">
                机器人使用说明
              </Divider>
            </div>

            <section
              v-for="sec in docSections"
              :key="sec.heading"
              class="robots-doc__section"
            >
              <h4 class="robots-doc__subheading">{{ sec.heading }}</h4>
              <p v-if="sec.note" class="robots-doc__note">{{ sec.note }}</p>
              <dl class="robots-doc__dl">
                <div
                  v-for="row in sec.rows"
                  :key="row.dt"
                  class="robots-doc__dl-row"
                >
                  <dt>{{ row.dt }}</dt>
                  <dd>{{ row.dd }}</dd>
                </div>
              </dl>
            </section>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane key="config" tab="机器人配置" :force-render="true">
          <div class="config-form-wrap">
            <div v-if="loadError" class="config-error">
              <Button type="primary" ghost @click="load">重新加载</Button>
            </div>
            <Form v-else layout="vertical" class="config-form max-w-4xl">
              <Row :gutter="[24, 8]">
                <Col
                  v-for="(item, idx) in items"
                  :key="`${item.configKey}-${idx}`"
                  :span="item.type === 'textarea' || isAddressDesc(item) ? 24 : 12"
                >
                  <Form.Item :label="item.configName" :help="item.configDesc">
                    <div
                      v-if="isSwitchWarn(item)"
                      class="warn-switch-field"
                    >
                      <Switch
                        v-if="item.configKey === PASSAGE_WARN_KEY"
                        :checked="formModel[item.configKey] === '1'"
                        checked-children="开"
                        un-checked-children="关"
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
                          addon-after="笔"
                          class="warn-switch-field__threshold"
                          @change="
                            (value) =>
                              onThresholdWarnChange(value, item.configKey)
                          "
                        />
                      </template>
                    </div>
                    <Input
                      v-else-if="item.type !== 'textarea' && !isAddressDesc(item)"
                      v-model:value="formModel[item.configKey]"
                      allow-clear
                      autocomplete="off"
                    />
                    <template v-else>
                      <Textarea
                        v-model:value="formModel[item.configKey]"
                        :maxlength="
                          isAddressDesc(item) ? ADDRESS_DESC_MAX : undefined
                        "
                        :show-count="isAddressDesc(item)"
                        :auto-size="{ minRows: 3, maxRows: 24 }"
                        :placeholder="
                          isAddressDesc(item)
                            ? `请输入钱包自定义描述，最多 ${ADDRESS_DESC_MAX} 个字符；留空时使用默认内容`
                            : undefined
                        "
                      />
                      <div v-if="isAddressDesc(item)" class="config-description">
                        用于 udz（地址）命令的钱包说明，最多
                        {{ ADDRESS_DESC_MAX }} 个字符；留空时使用默认内容。
                      </div>
                    </template>
                  </Form.Item>
                </Col>
              </Row>
              <div class="config-actions">
                <Button type="primary" :loading="saving" @click="confirmSubmit">
                  确认更新
                </Button>
              </div>
            </Form>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>

<style scoped>
.config-form-wrap {
  margin-top: 12px;
}

.config-description {
  margin-top: 6px;
  font-size: 12px;
  color: var(--ant-color-text-secondary, #8c8c8c);
}

.config-actions {
  margin-top: 8px;
}

.config-error {
  padding: 24px 0;
}

.warn-switch-field {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.warn-switch-field__threshold {
  width: 140px;
}

.robots-doc__heading {
  margin: 0 0 12px;
}

.robots-doc__alert {
  margin-bottom: 16px;
}

.robots-doc__alert-content p {
  line-height: 1.8;
  margin: 0;
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

.robots-doc__divider {
  margin: 16px 0;
}

.robots-doc__section {
  margin-bottom: 20px;
}

.robots-doc__subheading {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
}

.robots-doc__note {
  margin: 0 0 8px;
  line-height: 1.8;
  color: var(--ant-color-text-secondary, #6b7280);
}

.robots-doc__dl {
  margin: 0;
}

.robots-doc__dl-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
  line-height: 1.8;
}

.robots-doc__dl-row dt {
  flex: 0 0 140px;
  font-weight: 600;
}

.robots-doc__dl-row dd {
  margin: 0;
  flex: 1;
}
</style>
