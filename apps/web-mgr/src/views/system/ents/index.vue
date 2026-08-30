<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { Button, Card, Switch, Table, Tag, message } from 'ant-design-vue';

import { fetchSysEntTreeApi, updateSysEntApi, type SysEntNode } from '#/api';
import { hasEnt } from '#/utils/access';
import { formatDateTime } from '#/utils/format';

import SystemEntAddOrEditDialog from './components/SystemEntAddOrEditDialog.vue';

defineOptions({ name: 'EntPage' });

const loading = ref(false);
const dataSource = ref<SysEntNode[]>([]);
const stateBusy = reactive<Record<string, boolean>>({});
const editRef = ref<InstanceType<typeof SystemEntAddOrEditDialog>>();

const canEdit = computed(() => hasEnt('ENT_UR_ROLE_ENT_EDIT'));

const columns: TableColumnsType = [
  { dataIndex: 'entId', ellipsis: true, title: '资源权限ID', width: 260 },
  { dataIndex: 'entName', ellipsis: true, title: '资源名称', width: 160 },
  { dataIndex: 'menuIcon', ellipsis: true, title: '图标', width: 120 },
  { dataIndex: 'menuUri', ellipsis: true, title: '路径', width: 180 },
  { dataIndex: 'componentName', ellipsis: true, title: '组件名称', width: 160 },
  { dataIndex: 'entType', title: '类型', width: 90 },
  { dataIndex: 'state', title: '状态', width: 110 },
  { dataIndex: 'entSort', title: '排序', width: 80 },
  { dataIndex: 'updatedAt', title: '修改时间', width: 170 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 100 },
];

function normalizeChildren(nodes: SysEntNode[]): SysEntNode[] {
  return nodes.map((n) => {
    const children = n.children?.length
      ? normalizeChildren(n.children)
      : undefined;
    return { ...n, children };
  });
}

function patchNode(
  nodes: SysEntNode[],
  entId: string,
  patch: Partial<SysEntNode>,
): boolean {
  for (const n of nodes) {
    if (String(n.entId ?? '') === String(entId)) {
      Object.assign(n, patch);
      return true;
    }
    if (n.children?.length && patchNode(n.children, entId, patch)) return true;
  }
  return false;
}

async function loadData() {
  loading.value = true;
  try {
    dataSource.value = normalizeChildren((await fetchSysEntTreeApi()) ?? []);
  } finally {
    loading.value = false;
  }
}

async function onStateChange(
  row: SysEntNode,
  checked: boolean | string | number,
) {
  const entId = row.entId;
  if (!entId) return;
  const key = String(entId);
  const next = checked ? 1 : 0;
  stateBusy[key] = true;
  try {
    await updateSysEntApi(entId, { state: next, sysType: 'MGR' });
    message.success('更新成功');
    row.state = next;
  } catch {
    message.error('更新失败');
  } finally {
    stateBusy[key] = false;
  }
}

function onEditCallback(payload: {
  entId: string;
  patch: Record<string, unknown>;
}) {
  patchNode(dataSource.value, payload.entId, payload.patch);
}

onMounted(() => {
  void loadData();
});
</script>

<template>
  <Page auto-content-height title="权限管理">
    <Card>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="false"
        row-key="entId"
        :scroll="{ x: 1450 }"
        size="middle"
        default-expand-all-rows
        :children-column-name="'children'"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'state'">
            <Switch
              v-if="canEdit"
              :checked="record.state === 1"
              :loading="!!stateBusy[String(record.entId)]"
              checked-children="启用"
              un-checked-children="停用"
              @change="(c) => onStateChange(record as SysEntNode, c)"
            />
            <template v-else>
              <Tag :color="record.state === 1 ? 'success' : 'error'">
                {{ record.state === 1 ? '启用' : '停用' }}
              </Tag>
            </template>
          </template>
          <template v-else-if="column.dataIndex === 'updatedAt'">
            {{ formatDateTime(record.updatedAt) }}
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <Button
              v-if="canEdit"
              size="small"
              type="link"
              @click="editRef?.show(record.entId, 'MGR')"
            >
              修改
            </Button>
            <span v-else style="color: #94a3b8">--</span>
          </template>
        </template>
      </Table>
    </Card>

    <SystemEntAddOrEditDialog
      ref="editRef"
      :callback-func="onEditCallback"
    />
  </Page>
</template>
