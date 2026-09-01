# 新前端 × 后端 API 覆盖差距

> 更新：2026-09-01（P0/P1/清理已落地）  
> 范围：`asiapay-admin` 三端（web-mgr / web-mch / web-agent）对照 Diamond 后端（mgr-api / mch-api / agent-api）  
> 口径：**API 层是否被前端调用**，不是每个按钮交互 100% 对齐旧端。异步导出按「整套任务接口」计 1 类能力。

## 总览

| 端 | API 覆盖（估计） | 说明 |
|----|------------------|------|
| 运营端 web-mgr | ~99% | P0 已修；无未接线业务缺口 |
| 商户端 web-mch | ~99% | 主体已齐；已收敛导出常量 |
| 代理端 web-agent | ~99% | P1 日终导出已接线；`PUT /current/user` API 已补 |

---

## 已修复

### 运营端 P0

| 项 | 路径 | 说明 |
|----|------|------|
| 商户调冻结 | `PUT /mchBalance/{mchNo}/freeze` | `changeMchFreezeApi` + `MchFreezeAdjustDialog` + 列表入口 |
| 通知单条重发 | `POST /mchNotify/resend` | body 传 JSON 字符串 `notifyId` |

### 代理端 P1 / P2

| 项 | 路径 | 说明 |
|----|------|------|
| 日终统计异步导出 | `/agentDayStatExport/task/*` | `agentDayStatExportApi` + `useAgentDayStatExport` + 日终页导出/报表列表 |
| 资料更新 API | `PUT /current/user` | `updateCurrentUserApi`；UI 谷歌绑定仍优先 `bindGoogleApi` |

### 清理

| 项 | 说明 |
|----|------|
| 三端 `refreshTokenApi` | 改为空实现，不再请求不存在的 `/auth/refresh` |
| 商户端 `EXPORT_PATHS` | 仅保留 `payOrder` / `mchHistory` / `mchPrepaidHistory`，去掉 mgr 路径 |

---

## 后端有、管理端不必接

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/anon/pay/{id}[/confirm]` | 匿名付款 HTML 页，非管理端 |
| POST | `/api/anon/channel/notify` | 通道回调入口，非前端调用 |
| GET | `/api/passageHourlyStat/download` | 成率报表用带 iToken 的链接下载即可 |

### 可忽略

| 项 | 说明 |
|----|------|
| 旧同步导出 `GET …/export` | 已用异步 `export/task` |

---

## 已基本覆盖的能力块（运营端）

- 鉴权 / 个人中心（谷歌绑定、改密）
- 主页图表、进单开关、排名/并发
- 商户 / 代理 / 商户分组 CRUD + 批量 + 预付结算 + 调冻结
- 通道 / 产品 / 接口 / 供应商 CRUD + 批量 + 日切
- 订单、强制补单、改金额、异常单、通知重发
- 结算审核（商户/代理）、统计与流水、异步导出（约 14 类）
- 系统用户/角色/权限/配置/日志

---

## 后续可选

若要继续比「页面交互」对齐旧端（列、工具栏、抽屉开关），需另开 **旧 mgr-web / mch-web / agent-web 逐页 UX 对照**——那是 UI 缺口，不是本表的 API 覆盖率。

## 统计备注

- 对照来源：mgr-api 约 85 个 Controller；web-mgr API 模块约 213 处 HTTP 调用；并与旧端行为交叉核对。
- 本报告不等于每个列表列、工具栏、抽屉开关已 100% 对齐旧端 UI。
