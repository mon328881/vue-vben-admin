<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Button, Checkbox, Drawer, Space, message } from 'ant-design-vue';

import {
  fetchSysRolesApi,
  fetchSysUserRoleRelasApi,
  saveSysUserRoleRelasApi,
  type SysRole,
} from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const userId = ref<number | null>(null);
const allRoles = ref<SysRole[]>([]);
const selectedRoleIds = ref<string[]>([]);

const allChecked = computed(
  () =>
    allRoles.value.length > 0 &&
    selectedRoleIds.value.length === allRoles.value.length,
);
const indeterminate = computed(
  () =>
    selectedRoleIds.value.length > 0 &&
    selectedRoleIds.value.length < allRoles.value.length,
);

async function show(sysUserId: number) {
  userId.value = sysUserId;
  selectedRoleIds.value = [];
  allRoles.value = [];
  visible.value = false;
  loading.value = true;
  try {
    const rolesPage = await fetchSysRolesApi({ pageSize: -1 });
    const roles = rolesPage?.records ?? [];
    if ((rolesPage?.total ?? 0) <= 0 || !roles.length) {
      message.error('当前暂无角色，请先行添加');
      return;
    }
    allRoles.value = roles;
    const relas = await fetchSysUserRoleRelasApi(sysUserId);
    selectedRoleIds.value = relas.map((r) => String(r.roleId));
    visible.value = true;
  } catch {
    message.error('加载角色数据失败');
  } finally {
    loading.value = false;
  }
}

function onCheckAll(checked: boolean | string | number) {
  selectedRoleIds.value = checked
    ? allRoles.value.map((r) => r.roleId)
    : [];
}

async function save() {
  if (userId.value == null) return;
  saving.value = true;
  try {
    await saveSysUserRoleRelasApi(userId.value, selectedRoleIds.value);
    message.success('更新成功');
    visible.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="分配角色"
    :width="'30%'"
    :destroy-on-close="true"
  >
    <div class="role-assign-body">
      <div class="role-check-all">
        <Checkbox
          :checked="allChecked"
          :indeterminate="indeterminate"
          @change="(e) => onCheckAll(e.target.checked ?? false)"
        >
          全选
        </Checkbox>
      </div>
      <Checkbox.Group
        v-model:value="selectedRoleIds"
        class="role-checkbox-group"
      >
        <Checkbox
          v-for="role in allRoles"
          :key="role.roleId"
          :value="role.roleId"
        >
          {{ role.roleName }}
        </Checkbox>
      </Checkbox.Group>
    </div>
    <template #footer>
      <div class="drawer-btn-center">
        <Space>
          <Button @click="visible = false">取消</Button>
          <Button type="primary" :loading="saving" @click="save">保存</Button>
        </Space>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
.role-assign-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-check-all {
  padding-bottom: 8px;
  border-bottom: 1px solid hsl(var(--border));
}

.role-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drawer-btn-center {
  display: flex;
  justify-content: center;
}
</style>
