# AsiaPay Admin — Vben 多门户前端（位于 Diamond 仓库内）

基于 [Vben Admin 完整版](https://doc.vben.pro/guide/introduction/quick-start.html)（非精简版）搭建。

| 项 | 值 |
|----|----|
| 本地目录 | `<Diamond>/asiapay-admin` |
| Git 远程 | `https://github.com/mon328881/vue-vben-admin.git` |
| 本地文件夹名 | `asiapay-admin`（与远程仓库名不同，按双根工作区约定） |

与现有 `mgr-web` / `mch-web` / `agent-web` 并存；后续业务以本多门户为准对接 `mgr-api` / `mch-api` / `agent-api`。

## 首次拉取

在 Diamond 仓库根目录：

```bash
git clone https://github.com/mon328881/vue-vben-admin.git asiapay-admin
```

该目录已写入 Diamond 根 `.gitignore`（`/asiapay-admin/`），作为独立 Git 仓库嵌套使用，勿提交进 Diamond。

## 门户一览

| 门户 | 包名 | 开发命令 | 默认端口 | 代理后端 |
|------|------|----------|----------|----------|
| 运营端 | `@asiapay/web-mgr` | `pnpm dev:mgr` | http://localhost:5666 | `mgr-api` `:8090` |
| 商户端 | `@asiapay/web-mch` | `pnpm dev:mch` | http://localhost:5667 | `mch-api` `:8081` |
| 代理端 | `@asiapay/web-agent` | `pnpm dev:agent` | http://localhost:5668 | `agent-api` `:8083` |

同时启动三个门户：

```bash
cd asiapay-admin
pnpm dev:portals
```

官方演示应用（`web-antd` / `web-ele` / `web-naive` 等）仍保留在 monorepo 中，便于对照组件与升级。

## 环境要求

- Node.js `^22.18.0 || ^24.12.0`
- 仅支持 `pnpm`（推荐通过 corepack）

## 安装与启动

```bash
cd asiapay-admin

corepack enable
pnpm install
# 若启动报 @vben/vite-config 解析失败：
pnpm -r run --if-present stub

pnpm dev:mgr    # 运营端
pnpm dev:mch    # 商户端
pnpm dev:agent  # 代理端
```

也可执行 `pnpm dev`，在交互列表中选择对应 `@asiapay/web-*` 应用。

## 与后端联调

1. 在仓库根目录分别启动对应后端（`mgr-api` / `mch-api` / `agent-api`）。
2. 各门户已关闭 Nitro Mock（`VITE_NITRO_MOCK=false`），`/api` 代理到上表端口且**保留** `/api` 前缀。
3. **鉴权已对接 AsiaPay 协议**（对齐旧版 `mgr-web` / `mch-web` / `agent-web`）：
   - 登录：`POST /api/anon/auth/validate`（Base64 字段 `ia/ip/vc/vt/gc` + 图形验证码）
   - Token：响应 `data.iToken`，请求头 `iToken`（非 Bearer）
   - 用户/菜单：`GET /api/current/user`（`entIdList` + `allMenuRouteTree`）
   - 退出：`POST /api/current/logout`
   - `accessMode: backend`，首页 `/main`；未迁移业务页走 coming-soon 占位
4. 业务页面按模块从旧版前端逐步迁移（P0 已对接：主页 KPI、商户列表、代理列表、支付订单、操作员）。

## Cursor 工作区（双根）

推荐打开 Diamond 根目录的 `asiapay-admin.code-workspace`：

1. **Diamond · 后端与旧端** → `.`
2. **asiapay-admin · 新前端** → `asiapay-admin/`（即本仓库 / `vue-vben-admin`）

也可只打开 `asiapay-admin/` 或其内的 `asiapay-admin.code-workspace`，减少误改后端模块。

## 版本

- 远程仓库：`mon328881/vue-vben-admin`（fork 自上游 `vue-vben-admin` 完整 monorepo）
- UI 基线：Ant Design Vue（由 `web-antd` 复制为三门户）
