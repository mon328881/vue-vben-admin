<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Form,
  Input,
  Popconfirm,
  Space,
  Table,
  message,
} from 'ant-design-vue';

import {
  deleteSysRoleApi,
  fetchSysRolesApi,
  type SysRole,
} from '#/api';
import FilterActions from '#/components/list/FilterActions.vue';
import { hasEnt } from '#/utils/access';

import RoleFormDrawer from './components/RoleFormDrawer.vue';

defineOptions({ name: 'RolePage' });

const loading = ref(false);
const dataSource = ref<SysRole[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const query = reactive({
  roleId: '',
  roleName: '',
});

const formRef = ref<InstanceType<typeof RoleFormDrawer>>();

const canAdd = computed(() => hasEnt('ENT_UR_ROLE_ADD'));
const canEdit = computed(() => hasEnt('ENT_UR_ROLE_EDIT'));
const canDel = computed(() => hasEnt('ENT_UR_ROLE_DEL'));

const columns: TableColumnsType<SysRole> = [
  { dataIndex: 'roleId', fixed: 'left', title: '角色ID', width: 200 },
  { dataIndex: 'roleName', title: '角色名称', minWidth: 200 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 160 },
];

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    const page = await fetchSysRolesApi({
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
      roleId: query.roleId || undefined,
      roleName: query.roleName || undefined,
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
  query.roleId = '';
  query.roleName = '';
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

async function onDelete(row: SysRole) {
  await deleteSysRoleApi(row.roleId);
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
  <Page auto-content-height title="角色管理">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
      <Form layout="inline" @finish="onSearch">
        <Form.Item>
          <Input
            v-model:value="query.roleId"
            allow-clear
            placeholder="角色ID"
          />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.roleName"
            allow-clear
            placeholder="角色名称"
          />
        </Form.Item>
        <Form.Item class="ap-filter-actions">
          <FilterActions @reset="onReset" />
        </Form.Item>
      </Form>
    </Card>

    <Card>
      <div class="ap-table-toolbar">
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
        row-key="roleId"
        size="middle"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'action'">
            <Space>
              <Button
                v-if="canEdit"
                size="small"
                type="link"
                @click="formRef?.showEdit(record.roleId)"
              >
                修改
              </Button>
              <Popconfirm
                v-if="canDel"
                title="确认删除？"
                description="删除后不可恢复，请谨慎操作。"
                @confirm="onDelete(record as SysRole)"
              >
                <Button danger size="small" type="link">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <RoleFormDrawer ref="formRef" @success="onFormSuccess" />
    </div>
  </Page>
</template>
