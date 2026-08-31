<script lang="ts" setup>
import { Card, Col, Row, Statistic } from 'ant-design-vue';

import type { PrepaidHistoryStat } from '#/api/modules/history';
import {
  formatExchangeRate,
  formatPrepaidQuantity,
  formatYuan,
  signedYuan,
} from '#/utils/format';

defineProps<{
  stat: PrepaidHistoryStat;
}>();

function formatAvgRate(value?: number | null) {
  if (value == null) return '—';
  return formatExchangeRate(value);
}

function formatUNet(value?: number | null) {
  if (value == null) return '—';
  if (value === 0) return '0.00';
  return signedYuan(value);
}
</script>

<template>
  <Row :gutter="[12, 12]" class="ap-page-stats">
    <Col :md="6" :span="12">
      <Card size="small">
        <Statistic title="变更金额总计" :value="formatYuan(stat.totalAmount)" />
      </Card>
    </Col>
    <Col :md="6" :span="12">
      <Card size="small">
        <Statistic
          title="U变更总数"
          :value="formatPrepaidQuantity(stat.totalUChange)"
        />
      </Card>
    </Col>
    <Col :md="6" :span="12">
      <Card size="small">
        <Statistic title="U净总数" :value="formatUNet(stat.totalUNet)" />
      </Card>
    </Col>
    <Col :md="6" :span="12">
      <Card size="small">
        <Statistic title="平均费率" :value="formatAvgRate(stat.avgRate)" />
      </Card>
    </Col>
  </Row>
</template>
