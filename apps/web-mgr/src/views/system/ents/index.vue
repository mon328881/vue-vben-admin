<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import {
  Button,
  Card,
  Input,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from 'ant-design-vue';

import { fetchSysEntTreeApi, updateSysEntApi, type SysEntNode } from '#/api';
import { hasEnt } from '#/utils/access';
import { formatDateTime } from '#/utils/format';

import SystemEntFormDrawer from './components/SystemEntFormDrawer.vue';

defineOptions({ name: 'EntPage' });

const loading = ref(false);
const dataSource = ref<SysEntNode[]>([]);
const expandedRowKeys = ref<string[]>([]);
const keyword = ref('');
const stateBusy = reactive<Record<string, boolean>>({});
const editRef = ref<InstanceType<typeof SystemEntFormDrawer>>();

const canEdit = computed(() => hasEnt('ENT_UR_ROLE_ENT_EDIT'));

const columns: TableColumnsType = [
  { dataIndex: 'entName', ellipsis: true, title: '资源名称', width: 220 },
  { dataIndex: 'entId', ellipsis: true, title: '权限标识', width: 260 },
  { dataIndex: 'entType', title: '类型', width: 100 },
  { dataIndex: 'menuIcon', ellipsis: true, title: '图标', width: 120 },
  { dataIndex: 'menuUri', ellipsis: true, title: '路径', width: 180 },
  { dataIndex: 'componentName', ellipsis: true, title: '组件', width: 150 },
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

function collectKeys(nodes: SysEntNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    if (n.entId) acc.push(String(n.entId));
    if (n.children?.length) collectKeys(n.children, acc);
  }
  return acc;
}

function filterTree(nodes: SysEntNode[], kw: string): SysEntNode[] {
  const q = kw.trim().toLowerCase();
  if (!q) return nodes;
  const walk = (list: SysEntNode[]): SysEntNode[] => {
    const out: SysEntNode[] = [];
    for (const n of list) {
      const children = n.children?.length ? walk(n.children) : [];
      const hit =
        String(n.entId ?? '')
          .toLowerCase()
          .includes(q) ||
        String(n.entName ?? '')
          .toLowerCase()
          .includes(q) ||
        String(n.menuUri ?? '')
          .toLowerCase()
          .includes(q) ||
        String(n.componentName ?? '')
          .toLowerCase()
          .includes(q);
      if (hit || children.length) {
        out.push({ ...n, children: children.length ? children : undefined });
      }
    }
    return out;
  };
  return walk(nodes);
}

const displayData = computed(() => filterTree(dataSource.value, keyword.value));

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
    expandedRowKeys.value = collectKeys(dataSource.value);
  } finally {
    loading.value = false;
  }
}

function expandAll() {
  expandedRowKeys.value = collectKeys(displayData.value);
}

function collapseAll() {
  expandedRowKeys.value = [];
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

function entTypeMeta(type?: string) {
  const t = String(type ?? '').toUpperCase();
  if (t === 'ML') return { color: 'processing', label: '目录' };
  if (t === 'MO') return { color: 'success', label: '菜单' };
  if (t === 'PB') return { color: 'warning', label: '按钮' };
  return { color: 'default', label: t || '--' };
}

function iconName(icon?: string) {
  if (!icon) return '';
  // 旧数据可能是 ant-design 类名或 lucide 名
  if (icon.includes(':')) return icon;
  if (icon.startsWith('lucide')) return icon;
  return '';
}

onMounted(() => {
  void loadData();
});
</script>

<template>
  <Page auto-content-height title="权限管理">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <div class="ent-toolbar">
          <Input
            v-model:value="keyword"
            allow-clear
            placeholder="搜索权限标识 / 名称 / 路径"
            style="max-width: 320px"
          />
          <Space>
            <Button @click="expandAll">展开全部</Button>
            <Button @click="collapseAll">收起全部</Button>
            <Button :loading="loading" @click="loadData">刷新</Button>
          </Space>
        </div>
      </Card>

      <Card>
        <Table
          v-model:expanded-row-keys="expandedRowKeys"
          :columns="columns"
          :data-source="displayData"
          :loading="loading"
          :pagination="false"
          row-key="entId"
          :scroll="{ x: 1500 }"
          size="middle"
          :children-column-name="'children'"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'entName'">
              <div class="ent-name-cell">
                <span class="ent-name-cell__text">{{
                  record.entName || '--'
                }}</span>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'entId'">
              <code class="ent-id">{{ record.entId }}</code>
            </template>
            <template v-else-if="column.dataIndex === 'entType'">
              <Tag :color="entTypeMeta(record.entType as string).color">
                {{ entTypeMeta(record.entType as string).label }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'menuIcon'">
              <Tooltip v-if="record.menuIcon" :title="String(record.menuIcon)">
                <span class="ent-icon">
                  <IconifyIcon
                    v-if="iconName(record.menuIcon as string)"
                    :icon="iconName(record.menuIcon as string)"
                    class="size-4"
                  />
                  <span v-else>{{ record.menuIcon }}</span>
                </span>
              </Tooltip>
              <span v-else class="text-muted">--</span>
            </template>
            <template v-else-if="column.dataIndex === 'state'">
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
              {{ formatDateTime(record.updatedAt as string) }}
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <div class="ap-table-ops">
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  class="ap-table-ops__link"
                  @click="editRef?.show(record.entId as string, 'MGR')"
                >
                  修改
                </Button>
                <span v-else class="text-muted">--</span>
              </div>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <SystemEntFormDrawer ref="editRef" :callback-func="onEditCallback" />
  </Page>
</template>

<style scoped>
.ent-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ent-name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ent-name-cell__text {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ent-id {
  font-size: 12px;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 8%);
  padding: 1px 6px;
  border-radius: 4px;
}

.ent-icon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: hsl(var(--foreground));
}

.text-muted {
  color: hsl(var(--muted-foreground));
}
</style>
