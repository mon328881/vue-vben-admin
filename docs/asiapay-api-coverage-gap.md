# 新前端 × 后端 API 覆盖差距

> 更新：2026-09-01  
> 范围：`asiapay-admin` 三端（web-mgr / web-mch / web-agent）对照 Diamond 后端（mgr-api / mch-api / agent-api）  
> 口径：**API 层是否被前端调用**，不是每个按钮交互 100% 对齐旧端。异步导出按「整套任务接口」计 1 类能力。

## 总览

| 端 | API 覆盖（估计） | 说明 |
|----|------------------|------|
| 运营端 web-mgr | ~98% | 两个 P0 已修；剩余多为清理项 |
| 商户端 web-mch | ~95%+ | 主体已齐；多为常量/死代码清理 |
| 代理端 web-agent | ~93% | **P1：日终异步导出未接线** |

「约九成」原指运营端业务接口主体已接上；P0 落地后运营端约 **98%**。

---

## 运营端 web-mgr ↔ mgr-api

### 已修复的 P0

| 项 | 路径 | 状态 | 说明 |
|----|------|------|------|
| 商户调冻结 | `PUT /mchBalance/{mchNo}/freeze` | 已修 | `changeMchFreezeApi` + `MchFreezeAdjustDialog` + 商户列表入口 |
| 通知单条重发 | `POST /mchNotify/resend` | 已修 | body 传 JSON 字符串 `notifyId`，对齐旧端与后端 |

### 仍未对齐 / 待处理

| 优先级 | 缺口 | 路径 | 说明 |
|--------|------|------|------|
| 清理 | 无效 `refreshTokenApi` | `POST /auth/refresh` | mgr-api 无 refresh；登录态靠 iToken |

### 后端有、管理端不必接

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/anon/pay/{id}[/confirm]` | 匿名付款 HTML 页，非管理端 |
| POST | `/api/anon/channel/notify` | 通道回调入口，非前端调用 |
| GET | `/api/passageHourlyStat/download` | 成率报表用带 iToken 的链接下载即可 |

### 已基本覆盖的能力块

- 鉴权 / 个人中心（谷歌绑定、改密）
- 主页图表、进单开关、排名/并发
- 商户 / 代理 / 商户分组 CRUD + 批量 + 预付结算 + **调冻结**
- 通道 / 产品 / 接口 / 供应商 CRUD + 批量 + 日切
- 订单、强制补单、改金额、异常单、**通知重发**
- 结算审核（商户/代理）、统计与流水、异步导出（约 14 类）
- 系统用户/角色/权限/配置/日志

---

## 商户端 web-mch ↔ mch-api

主体已齐：鉴权、主页、应用、订单、流水、日终、预付、结算申请、收银台、异步导出等均已对接。

| 优先级 | 缺口 | 说明 |
|--------|------|------|
| 清理 | `EXPORT_PATHS` 含大量 mgr 路径 | 商户端用不到的导出常量，建议收敛 |
| 清理 | `refreshTokenApi` | mch-api 无 refresh |
| 忽略 | 旧同步导出 `GET /payOrder/export`、`/mchHistory/export` | 已用异步 `export/task`，可忽略 |

---

## 代理端 web-agent ↔ agent-api

| 优先级 | 缺口 | 路径 | 说明 |
|--------|------|------|------|
| **P1** | 日终统计异步导出 | `/agentDayStatExport/task/*`（约 6 接口） | **真正还缺的业务能力**：agent-api 有完整导出；web-agent 日终页未接线 |
| P2 | 资料更新 | `PUT /current/user` | 可选；谷歌绑定已走 `bindGoogle` |
| 清理 | `refreshTokenApi` | `POST /auth/refresh` | agent-api 无 refresh |

---

## 建议落地顺序

1. **代理端 P1**：日终统计页挂上 `agentDayStatExport`（submit / running / completed / download 等）。
2. **清理（可选）**：去掉三端 `refreshToken`；收敛 mch 端多余 `EXPORT_PATHS`；按需补 agent `PUT /current/user`。
3. **若要比「页面交互」**：需另开「旧 mgr-web 逐页按钮/抽屉对照」——那是 UX 缺口，不是本表的 API 覆盖率。

---

## 统计备注

- 对照来源：mgr-api 约 85 个 Controller；web-mgr API 模块约 213 处 HTTP 调用；并与旧端 mgr-web 行为交叉核对。
- 本报告不等于每个列表列、工具栏、抽屉开关已 100% 对齐旧端 UI。
