<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { PlatUser } from '#/api';
import type { PlatEntId } from '#/constants/entitlements';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Checkbox,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  fetchPlatUsersApi,
  resetPlatUserGoogleApi,
  resetPlatUserPasswordApi,
  savePlatUserApi,
} from '#/api';
import FilterActions from '#/components/list/FilterActions.vue';
import {
  DEFAULT_OPERATOR_ENTS,
  PLAT_ENT_GROUPS,
  summarizePlatEnts,
} from '#/constants/entitlements';

defineOptions({ name: 'PlatUsersPage' });

const loading = ref(false);
const dataSource = ref<PlatUser[]>([]);
const total = ref(0);
const keyword = ref('');
const drawerOpen = ref(false);
const creating = ref(true);
const form = reactive({
  userId: '',
  loginUsername: '',
  realname: '',
  telegram: '',
  state: 1 as 0 | 1,
  isAdmin: 0 as 0 | 1,
  googleAuth: 0 as 0 | 1,
  entIdList: [...DEFAULT_OPERATOR_ENTS] as string[],
});

const columns: TableColumnsType = [
  { dataIndex: 'loginUsername', title: '登录名', width: 140 },
  { dataIndex: 'realname', title: '姓名', width: 120 },
  { dataIndex: 'telegram', title: '飞机号', width: 140 },
  { dataIndex: 'isAdmin', title: '超管', width: 90 },
  { dataIndex: 'entIdList', title: '权限', ellipsis: true },
  { dataIndex: 'googleAuth', title: '谷歌验证', width: 110 },
  { dataIndex: 'state', title: '状态', width: 90 },
  { dataIndex: 'createdAt', title: '创建时间', width: 170 },
  { dataIndex: 'action', title: '操作', width: 260 },
];

const pwdOpen = ref(false);
const pwdBusy = ref(false);
const pwdTarget = ref<null | PlatUser>(null);
const pwdForm = reactive({ password: '' });

const entSet = computed(() => new Set(form.entIdList));

async function loadData() {
  loading.value = true;
  try {
    const page = await fetchPlatUsersApi({ keyword: keyword.value });
    dataSource.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function onReset() {
  keyword.value = '';
  void loadData();
}

function showCreate() {
  creating.value = true;
  Object.assign(form, {
    userId: '',
    loginUsername: '',
    realname: '',
    telegram: '',
    state: 1,
    isAdmin: 0,
    googleAuth: 0,
    entIdList: [...DEFAULT_OPERATOR_ENTS],
  });
  drawerOpen.value = true;
}

function asUser(row: Record<string, unknown>) {
  return row as unknown as PlatUser;
}

function onEditRow(row: Record<string, unknown>) {
  showEdit(asUser(row));
}

function showEdit(row: PlatUser) {
  creating.value = false;
  Object.assign(form, {
    ...row,
    googleAuth: row.googleAuth ?? 0,
    entIdList: [...(row.entIdList ?? DEFAULT_OPERATOR_ENTS)],
  });
  drawerOpen.value = true;
}

function hasEntCode(code: string) {
  return entSet.value.has(code);
}

function toggleEnt(code: PlatEntId, checked: boolean, dependsOn?: PlatEntId) {
  const next = new Set(form.entIdList);
  if (checked) {
    next.add(code);
    if (dependsOn) next.add(dependsOn);
  } else {
    next.delete(code);
    for (const group of PLAT_ENT_GROUPS) {
      for (const item of group.items) {
        if (item.dependsOn === code) next.delete(item.code);
      }
    }
  }
  form.entIdList = [...next];
}

async function submit() {
  if (!form.loginUsername.trim() || !form.realname.trim()) {
    message.error('请填写登录名与姓名');
    return;
  }
  try {
    await savePlatUserApi({ ...form });
    message.success('保存成功');
    drawerOpen.value = false;
    await loadData();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败');
  }
}

function showResetPwd(row: PlatUser) {
  pwdTarget.value = row;
  pwdForm.password = '';
  pwdOpen.value = true;
}

async function confirmResetPwd() {
  if (!pwdTarget.value) return;
  if (
    pwdForm.password.trim().length < 6 ||
    pwdForm.password.trim().length > 12
  ) {
    message.error('新密码长度为 6-12 位');
    return;
  }
  pwdBusy.value = true;
  try {
    await resetPlatUserPasswordApi(pwdTarget.value.userId, pwdForm.password);
    message.success('已重置密码');
    pwdOpen.value = false;
  } catch (error) {
    message.error(error instanceof Error ? error.message : '重置失败');
  } finally {
    pwdBusy.value = false;
  }
}

async function resetGoogle(row: PlatUser) {
  try {
    await resetPlatUserGoogleApi(row.userId);
    message.success('已重置谷歌密钥，需重新绑定');
    await loadData();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '重置失败');
  }
}

onMounted(loadData);
</script>

<template>
  <Page auto-content-height title="管理账号">
    <div class="ap-page-stack">
      <Card :bordered="false" class="ap-page-filter">
        <Form layout="inline" @submit.prevent="loadData">
          <Form.Item label="关键词">
            <Input
              v-model:value="keyword"
              allow-clear
              placeholder="登录名/姓名"
              style="width: 180px"
            />
          </Form.Item>
          <Form.Item class="ap-filter-actions">
            <FilterActions @reset="onReset" />
          </Form.Item>
        </Form>
      </Card>

      <Card :bordered="false">
        <div class="ap-table-toolbar">
          <Button type="primary" @click="showCreate">新建账号</Button>
        </div>
        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="{ total, showSizeChanger: true }"
          row-key="userId"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'isAdmin'">
              <Tag :color="record.isAdmin === 1 ? 'red' : 'default'">
                {{ record.isAdmin === 1 ? '是' : '否' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'entIdList'">
              {{ summarizePlatEnts(asUser(record)) }}
            </template>
            <template v-else-if="column.dataIndex === 'googleAuth'">
              <Tag :color="record.googleAuth === 1 ? 'processing' : 'default'">
                {{ record.googleAuth === 1 ? '已绑定' : '未绑定' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="record.state === 1 ? 'success' : 'default'">
                {{ record.state === 1 ? '启用' : '停用' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <div class="ap-table-ops">
                <Button type="link" size="small" @click="onEditRow(record)">
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="showResetPwd(asUser(record))"
                >
                  重置密码
                </Button>
                <Popconfirm
                  title="将清除已绑定的谷歌密钥，下次登录需重新绑定。确认重置？"
                  @confirm="resetGoogle(asUser(record))"
                >
                  <Button type="link" size="small">重置谷歌</Button>
                </Popconfirm>
              </div>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <Drawer
      v-model:open="drawerOpen"
      :title="creating ? '新建管理账号' : '编辑管理账号'"
      :width="520"
    >
      <div class="ap-drawer-body">
        <Form layout="vertical" class="ap-drawer-form ap-form-stacked">
          <Form.Item label="登录名" required>
            <Input v-model:value="form.loginUsername" :disabled="!creating" />
          </Form.Item>
          <Form.Item label="姓名" required>
            <Input v-model:value="form.realname" />
          </Form.Item>
          <Form.Item label="飞机号">
            <Input
              v-model:value="form.telegram"
              placeholder="@username 或数字 ID"
            />
          </Form.Item>
          <Form.Item label="超管">
            <Radio.Group v-model:value="form.isAdmin">
              <Radio :value="1">是</Radio>
              <Radio :value="0">否</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item v-if="form.isAdmin === 1" label="权限">
            <p class="ap-section-desc">超管拥有全部菜单与写操作，无需勾选。</p>
          </Form.Item>
          <Form.Item v-else label="权限">
            <div class="plat-ent-groups">
              <section
                v-for="group in PLAT_ENT_GROUPS"
                :key="group.title"
                class="plat-ent-group"
              >
                <div class="plat-ent-group__title">{{ group.title }}</div>
                <div class="plat-ent-group__items">
                  <Checkbox
                    v-for="item in group.items"
                    :key="item.code"
                    :checked="hasEntCode(item.code)"
                    :disabled="!!item.dependsOn && !hasEntCode(item.dependsOn)"
                    @update:checked="
                      (checked: boolean) =>
                        toggleEnt(item.code, checked, item.dependsOn)
                    "
                  >
                    {{ item.label }}
                  </Checkbox>
                </div>
              </section>
            </div>
          </Form.Item>
          <Form.Item label="谷歌验证">
            <Radio.Group v-model:value="form.googleAuth">
              <Radio :value="1">已绑定</Radio>
              <Radio :value="0">未绑定</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="状态">
            <Radio.Group v-model:value="form.state">
              <Radio :value="1">启用</Radio>
              <Radio :value="0">停用</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </div>
      <template #footer>
        <Space>
          <Button @click="drawerOpen = false">取消</Button>
          <Button type="primary" @click="submit">保存</Button>
        </Space>
      </template>
    </Drawer>

    <Modal
      v-model:open="pwdOpen"
      title="重置密码"
      :confirm-loading="pwdBusy"
      ok-text="确认重置"
      @ok="confirmResetPwd"
    >
      <p class="ap-section-desc" style="margin-top: 0">
        账号 {{ pwdTarget?.loginUsername }}，新密码 6–12 位。
      </p>
      <Input.Password
        v-model:value="pwdForm.password"
        placeholder="新密码"
        autocomplete="new-password"
      />
    </Modal>
  </Page>
</template>

<style scoped>
.plat-ent-groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.plat-ent-group__title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.plat-ent-group__items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
