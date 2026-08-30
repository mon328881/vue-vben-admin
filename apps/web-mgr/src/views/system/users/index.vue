<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  deleteSysUserApi,
  fetchSysUsersApi,
  updateSysUserStateApi,
} from '#/api';
import type { SysUser } from '#/api/types/business';
import { hasEnt } from '#/utils/access';
import { formatDateTime } from '#/utils/format';

import SysUserFormDrawer from './components/SysUserFormDrawer.vue';
import SystemUserRoleAssignDrawer from './components/SystemUserRoleAssignDrawer.vue';

defineOptions({ name: 'SysUserPage' });

const loading = ref(false);
const dataSource = ref<SysUser[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const query = reactive({
  loginUsername: '',
  sysUserId: '',
});
const stateBusy = ref<Record<string, boolean>>({});

const formRef = ref<InstanceType<typeof SysUserFormDrawer>>();
const roleRef = ref<InstanceType<typeof SystemUserRoleAssignDrawer>>();

const canAdd = computed(() => hasEnt('ENT_UR_USER_ADD'));
const canEdit = computed(() => hasEnt('ENT_UR_USER_EDIT'));
const canDel = computed(() => hasEnt('ENT_UR_USER_DELETE'));
const canUpdRole = computed(() => hasEnt('ENT_UR_USER_UPD_ROLE'));

const columns: TableColumnsType<SysUser> = [
  { dataIndex: 'sysUserId', fixed: 'left', title: '用户ID', width: 120 },
  { dataIndex: 'loginUsername', title: '用户登录名' },
  { dataIndex: 'isAdmin', title: '超管', width: 100 },
  { dataIndex: 'state', title: '状态', width: 140 },
  { dataIndex: 'createdAt', title: '创建时间', width: 180 },
  { dataIndex: 'updatedAt', title: '修改时间', width: 180 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 220 },
];

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    const page = await fetchSysUsersApi({
      loginUsername: query.loginUsername || undefined,
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
      sysUserId: query.sysUserId || undefined,
    });
    dataSource.value = page?.records ?? [];
    total.value = page?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  void loadData(true);
}

function onReset() {
  query.loginUsername = '';
  query.sysUserId = '';
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

function displayName(row: SysUser) {
  return row.loginUsername || `ID:${row.sysUserId ?? '--'}`;
}

async function onToggleState(row: SysUser, checked: boolean | string | number) {
  const state = checked ? 1 : 0;
  const action = state === 1 ? '开启' : '关闭';
  const name = displayName(row);
  const ok = await new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: `确认${action}操作员？`,
      content:
        state === 1
          ? `确认开启操作员【${name}】？`
          : `确认关闭操作员【${name}】？关闭后该用户将立即退出系统且无法再次登录。`,
      okText: `确认${action}`,
      okType: state === 1 ? 'primary' : 'danger',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
  if (!ok) return;
  const key = String(row.sysUserId);
  stateBusy.value[key] = true;
  try {
    await updateSysUserStateApi(row.sysUserId, state);
    message.success(`操作员【${name}】${action}成功`);
    row.state = state;
  } catch {
    message.error(`操作员【${name}】${action}失败`);
  } finally {
    stateBusy.value[key] = false;
  }
}

async function onDelete(row: SysUser) {
  await deleteSysUserApi(row.sysUserId);
  message.success('删除成功');
  void loadData();
}

function onFormSuccess(toFirstPage: boolean) {
  void loadData(toFirstPage);
}

onMounted(() => {
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="操作员">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
      <Form layout="inline" @finish="onSearch">
        <Form.Item>
          <Input
            v-model:value="query.sysUserId"
            allow-clear
            placeholder="用户ID"
          />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.loginUsername"
            allow-clear
            placeholder="用户登录名"
          />
        </Form.Item>
        <Form.Item class="ap-filter-actions">
          <Space>
            <Button html-type="submit" type="primary">查询</Button>
            <Button @click="onReset">重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>

    <Card>
      <div class="mb-3">
        <Button v-if="canAdd" type="primary" @click="formRef?.showCreate()">
          新建
        </Button>
      </div>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
          total,
        }"
        row-key="sysUserId"
        size="middle"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'isAdmin'">
            <Tag v-if="Number(record.isAdmin) === 1" color="error">超管</Tag>
            <span v-else style="color: #94a3b8">否</span>
          </template>
          <template v-else-if="column.dataIndex === 'state'">
            <Switch
              :checked="record.state === 1"
              :loading="!!stateBusy[String(record.sysUserId)]"
              :disabled="!canEdit"
              checked-children="开启"
              un-checked-children="关闭"
              @change="(c) => onToggleState(record as SysUser, c)"
            />
          </template>
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
          <template v-else-if="column.dataIndex === 'updatedAt'">
            {{ formatDateTime(record.updatedAt) }}
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <Space>
              <Button
                v-if="canUpdRole"
                size="small"
                type="link"
                @click="roleRef?.show(record.sysUserId)"
              >
                变更角色
              </Button>
              <Button
                v-if="canEdit"
                size="small"
                type="link"
                @click="formRef?.showEdit(record.sysUserId)"
              >
                修改
              </Button>
              <Popconfirm
                v-if="canDel"
                title="确认删除？"
                description="删除后不可恢复，请谨慎操作。"
                @confirm="onDelete(record as SysUser)"
              >
                <Button danger size="small" type="link">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <SysUserFormDrawer ref="formRef" @success="onFormSuccess" />
    <SystemUserRoleAssignDrawer
      ref="roleRef"
      @success="() => loadData(false)"
    />
    </div>
  </Page>
</template>
