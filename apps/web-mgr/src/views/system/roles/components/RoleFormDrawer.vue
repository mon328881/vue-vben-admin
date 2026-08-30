<script lang="ts" setup>
import type { DataNode } from 'ant-design-vue/es/tree';

import { nextTick, ref } from 'vue';

import {
  Button,
  Drawer,
  Form,
  Input,
  Space,
  Tree,
  message,
} from 'ant-design-vue';

import {
  createSysRoleApi,
  fetchSysEntTreeApi,
  fetchSysRoleApi,
  fetchSysRoleEntRelasApi,
  updateSysRoleApi,
  type SysEntNode,
} from '#/api';
import { hasEnt } from '#/utils/access';

const emit = defineEmits<{ success: [toFirstPage: boolean] }>();

const visible = ref(false);
const creating = ref(true);
const detailLoading = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);
const form = ref({ roleName: '' });

const canDist = () => hasEnt('ENT_UR_ROLE_DIST');
const treeData = ref<DataNode[]>([]);
const checkedKeys = ref<string[]>([]);
const nodeMap = ref<
  Record<string, { pid?: string; children: SysEntNode[] }>
>({});

function flatten(nodes: SysEntNode[], cb: (n: SysEntNode) => void) {
  for (const n of nodes) {
    cb(n);
    if (n.children?.length) flatten(n.children, cb);
  }
}

function toTreeNodes(nodes: SysEntNode[]): DataNode[] {
  return nodes.map((n) => ({
    key: String(n.entId),
    title: n.entName,
    children: n.children?.length ? toTreeNodes(n.children) : undefined,
  }));
}

async function initTree(roleId?: string | null) {
  if (!canDist()) return;
  checkedKeys.value = [];
  treeData.value = [];
  nodeMap.value = {};
  const tree = (await fetchSysEntTreeApi()) ?? [];
  treeData.value = toTreeNodes(tree);
  flatten(tree, (n) => {
    nodeMap.value[String(n.entId)] = {
      pid: n.pid,
      children: n.children ?? [],
    };
  });
  const relas = await fetchSysRoleEntRelasApi(roleId ?? 'NONE');
  const leafSelected: string[] = [];
  (relas ?? []).forEach((r) => {
    const entId = String(r.entId);
    const node = nodeMap.value[entId];
    if (node && node.children.length <= 0) {
      leafSelected.push(entId);
    }
  });
  checkedKeys.value = leafSelected;
}

function getSelectedEntIdList(): string[] | false {
  if (!canDist()) return false;
  const result: string[] = [];
  const walkUp = (entId: string, acc: string[]) => {
    const node = nodeMap.value[entId];
    if (!node || entId === 'ROOT') return;
    acc.push(entId);
    if (node.pid && node.pid !== 'ROOT') {
      walkUp(node.pid, acc);
    }
  };
  for (const leaf of checkedKeys.value) {
    const chain: string[] = [];
    walkUp(leaf, chain);
    for (const id of chain) {
      if (!result.includes(id)) result.push(id);
    }
  }
  return result;
}

function resetForm() {
  form.value.roleName = '';
  editingId.value = null;
  checkedKeys.value = [];
  treeData.value = [];
}

async function showCreate() {
  creating.value = true;
  resetForm();
  visible.value = true;
  await nextTick();
  await initTree();
}

async function showEdit(roleId: string) {
  creating.value = false;
  editingId.value = roleId;
  visible.value = true;
  try {
    detailLoading.value = true;
    const data = await fetchSysRoleApi(roleId);
    form.value.roleName = String(data?.roleName ?? '');
  } finally {
    detailLoading.value = false;
  }
  await nextTick();
  await initTree(roleId);
}

async function save() {
  const name = form.value.roleName.trim();
  if (!name) {
    message.error('请输入角色名称');
    return;
  }
  const selected = getSelectedEntIdList();
  const entIdListStr = selected === false ? '' : JSON.stringify(selected ?? []);
  saving.value = true;
  try {
    if (creating.value) {
      await createSysRoleApi({ roleName: name, entIdListStr });
      message.success('新增成功');
    } else if (editingId.value != null) {
      await updateSysRoleApi(editingId.value, {
        roleName: name,
        entIdListStr,
      });
      message.success('修改成功');
    }
    visible.value = false;
    emit('success', creating.value);
    resetForm();
  } finally {
    saving.value = false;
  }
}

function onCheck(
  keys:
    | (string | number)[]
    | { checked: (string | number)[]; halfChecked: (string | number)[] },
) {
  const list = Array.isArray(keys) ? keys : keys.checked;
  checkedKeys.value = list.map(String);
}

defineExpose({ showCreate, showEdit });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="creating ? '新增角色' : '修改角色'"
    :width="480"
    :destroy-on-close="true"
    :mask-closable="false"
    @close="resetForm"
  >
    <div class="ap-drawer-body">
      <Form layout="vertical" :model="form">
        <Form.Item label="角色名称" name="roleName" required>
          <Input
            v-model:value="form.roleName"
            placeholder="请输入角色名称"
            allow-clear
            :maxlength="128"
          />
        </Form.Item>
        <div v-if="canDist()" class="role-dist">
          <p class="role-dist-hint">请选择权限：</p>
          <Tree
            v-if="treeData.length"
            checkable
            :tree-data="treeData"
            :checked-keys="checkedKeys"
            :selectable="false"
            default-expand-all
            @check="onCheck"
          />
        </div>
      </Form>
    </div>
    <template #footer>
      <Space>
        <Button type="primary" :loading="saving" @click="save">保存</Button>
        <Button @click="visible = false">取消</Button>
      </Space>
    </template>
  </Drawer>
</template>

<style scoped>
.role-dist-hint {
  margin: 0 0 8px;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}
</style>
