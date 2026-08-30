<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { Card, Col, Row, Statistic } from 'ant-design-vue';

defineOptions({ name: 'MainDashboard' });

const userStore = useUserStore();
</script>

<template>
  <Page description="商户端工作台" title="主页">
    <Row :gutter="[16, 16]">
      <Col :md="8" :span="24">
        <Card>
          <Statistic
            title="当前账号"
            :value="userStore.userInfo?.realName || '-'"
          />
        </Card>
      </Col>
      <Col :md="8" :span="24">
        <Card>
          <Statistic
            title="系统类型"
            :value="(userStore.userInfo as any)?.sysType || 'MCH'"
          />
        </Card>
      </Col>
      <Col :md="8" :span="24">
        <Card>
          <Statistic
            title="权限数"
            :value="((userStore.userInfo as any)?.entIdList || []).length"
          />
        </Card>
      </Col>
    </Row>
    <Card class="mt-4" title="说明">
      <p class="text-muted-foreground m-0 text-sm">
        已对接 mch-api 登录与菜单。业务页面将按模块从旧版 mch-web
        逐步迁移；暂未迁移的菜单会进入「即将上线」占位页。
      </p>
    </Card>
  </Page>
</template>
