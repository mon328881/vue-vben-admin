# AsiaPay Admin 前端依赖供应链安全漏洞与豁免清单 (Audit Exemptions)

> **基准报告**：`pnpm audit --prod --audit-level=critical`  
> **审计时间**：2026-10-05  
> **审计结论**：`Critical: 0` ｜ `High: 25` ｜ `Moderate: 17` ｜ `Low: 3`

---

## 1. 供应链风险概要

在多门户前端工程体系中，生产构建产物（`dist/`）经 Vite / oxc 打包为纯静态 Web 资源（HTML / JS / CSS）。依赖审计命中漏洞多源自 Monorepo 内部共享构建工具（`internal/*`）及开发 Mock 服务（`apps/backend-mock`）的间接依赖。

针对生产依赖（Production Dependencies）中扫描出的 High 等级告警，本文档逐项进行运行时可达性（Runtime Reachability）分析并登记书面豁免。

---

## 2. 25 项 High 等级漏洞分类研判与豁免台账

### 类别 A：Axios 运行时安全漏洞（8 处路径命中）

| 漏洞标识 (GHSA) | 严重级 | 漏洞组件 | 漏洞描述 | 客户端运行时可达性与豁免理由 |
|---|---|---|---|---|
| **GHSA-m8m8-qj5v-23w3** | High | `axios@1.19.0` | Node HTTP adapter 原型链污染 gadget 可致 request socket 劫持 | **不可达 / 豁免**：AsiaPay 前端门户（`apps/web-*`）100% 运行于浏览器沙箱环境，Axios 强制使用浏览器原生 `XMLHttpRequest` / `window.fetch`，Node.js HTTP/HTTPS 原生适配器代码在浏览器打包时已被 Rollup/Vite 树摇剥离，生产环境零风险。 |
| **GHSA-r4gj-5m52-g5wh** | High | `axios@1.19.0` | `maxRedirects: 0` 在 Fetch 适配器中未严格阻断重定向引发 SSRF | **不可达 / 豁免**：AsiaPay Web 前端所有 HTTP 请求均直接受浏览器同源策略（SOP）和 CORS 控制，浏览器自身管理 HTTP 3xx 重定向，客户端不存在 SSRF 威胁模型。 |

### 类别 B：Node-Forge RSA 验签漏洞（2 处路径命中）

| 漏洞标识 (GHSA) | 严重级 | 漏洞组件 | 漏洞描述 | 客户端运行时可达性与豁免理由 |
|---|---|---|---|---|
| **GHSA-86w9-cpqp-85rv** | High | `node-forge@1.4.0` | RSA PKCS#1 v1.5 签名校验接受额外嵌套 DigestAlgorithm 元素 | **不可达 / 豁免**：由 `apps/backend-mock > nitropack > listhen` 与 `internal/vite-config` 间接引入。仅用于本地开发阶段 Mock 服务器与 Vite 本地 HTTPS 证书伪造，生产构建 `pnpm build` 产物中完全无 `node-forge` 依赖注入。 |

### 类别 C：Braces 正则模式 DoS 漏洞（15 处路径命中）

| 漏洞标识 (GHSA) | 严重级 | 漏洞组件 | 漏洞描述 | 客户端运行时可达性与豁免理由 |
|---|---|---|---|---|
| **GHSA-vfj7-8cjw-p6xm** | High | `braces@3.0.3` | 深层嵌套 pattern 匹配导致调用栈耗尽拒绝服务 | **不可达 / 豁免**：由 `stylelint-config`、`nitropack`、`@intlify/unplugin-vue-i18n` 等构建/代码质量插件引入，仅在 CI/本地编译阶段匹配本地文件系统 glob 路径，不暴露任何外网输入入口，客户端生产产物无此依赖。 |

---

## 3. 跟踪与后续升级计划

1. **Axios**：待 upstream `vue-vben-admin` 或 `@vben/effects-request` 官方适配更新 `axios >= 1.20.0` 后平滑升级。
2. **构建侧工具链**：持续通过 `pnpm update --interactive --latest` 跟踪 Stylelint 及 Nitro 依赖链更新。
3. **门禁控制**：CI/CD 持续开启 `pnpm audit --prod --audit-level=critical`，阻断任何 Critical 级远程代码执行或凭据泄露缺陷进入主干分支。
