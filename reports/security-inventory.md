# AsiaPay Admin (新前端) 安全模式基线扫描与证据清单

- **扫描时间**: 2026-10-05T08:28:21.203Z
- **目标目录**: `asiapay-admin` (apps/web-*, packages/*)
- **总命中数**: 145 项模式命中

## 摘要统计

| 维度分类 | 描述 | 命中数量 |
| :--- | :--- | :---: |
| `D1_XSS_AND_DOM_SINKS` | XSS & Dangerous DOM / Execution Sinks | **33** |
| `D2_REDIRECT_AND_POSTMESSAGE` | Client Redirection & PostMessage Sinks | **44** |
| `D3_ROUTER_DYNAMIC_NAVIGATION` | Dynamic Router Navigation Sinks | **57** |
| `D4_STORAGE_AND_LOGGING` | Local Storage & Console Leakage Sinks | **8** |
| `D5_HARDCODED_SECRETS_PATTERNS` | Potential Hardcoded Secrets & Token Literals | **3** |

---

## 证据详情索引

### XSS & Dangerous DOM / Execution Sinks (`D1_XSS_AND_DOM_SINKS` - 共 33 项)

| 文件位置 | 行号 | 代码片段 |
| :--- | :---: | :--- |
| `apps/web-mch/src/views/apidoc/index.vue` | 799 | `&lt;pre&gt;&lt;code v-html="highlightJSON(ep.requestExample)"&gt;&lt;/code&gt;&lt;/pre&gt;` |
| `apps/web-mch/src/views/apidoc/index.vue` | 876 | `&lt;pre&gt;&lt;code v-html="highlightJSON(ep.response.success)"&gt;&lt;/code&gt;&lt;/pre&gt;` |
| `apps/web-mch/src/views/apidoc/index.vue` | 882 | `&lt;pre&gt;&lt;code v-html="highlightJSON(ep.response.error)"&gt;&lt;/code&gt;&lt;/pre&gt;` |
| `packages/@core/base/shared/src/utils/__tests__/dom.test.ts` | 140 | `document.body.innerHTML = '';` |
| `packages/@core/base/shared/src/utils/__tests__/resources.test.ts` | 8 | `document.head.innerHTML = '';` |
| `packages/@core/base/shared/src/utils/__tests__/update-css-variables.test.ts` | 8 | `document.head.innerHTML = `&lt;style id="custom-styles"&gt;${initialStyleContent}&lt;/style&gt;`;` |
| `packages/@core/base/shared/src/utils/__tests__/update-css-variables.test.ts` | 33 | `document.head.innerHTML = `&lt;style id="tdesign-styles"&gt;&lt;/style&gt;`;` |
| `packages/@core/composables/src/__tests__/use-layout-style.test.ts` | 14 | `document.body.innerHTML = '';` |
| `packages/@core/composables/src/__tests__/use-layout-viewport-height.test.ts` | 49 | `document.body.innerHTML = '';` |
| `packages/@core/composables/src/__tests__/use-scroll-lock.test.ts` | 54 | `document.body.innerHTML = '';` |
| `packages/@core/ui-kit/popup-ui/src/alert/__tests__/alert-builder.test.ts` | 49 | `document.body.innerHTML = '';` |
| `packages/@core/ui-kit/popup-ui/src/alert/__tests__/alert.test.ts` | 63 | `document.body.innerHTML = '';` |
| `packages/@core/ui-kit/popup-ui/src/drawer/__tests__/drawer-interaction.test.ts` | 32 | `mainContent.innerHTML = '&lt;div&gt;&lt;div&gt;&lt;/div&gt;&lt;/div&gt;';` |
| `packages/@core/ui-kit/popup-ui/src/drawer/__tests__/drawer-interaction.test.ts` | 105 | `document.body.innerHTML = '';` |
| `packages/@core/ui-kit/popup-ui/src/drawer/__tests__/drawer.test.ts` | 22 | `mainContent.innerHTML = '&lt;div&gt;&lt;div&gt;&lt;/div&gt;&lt;/div&gt;';` |
| `packages/@core/ui-kit/popup-ui/src/drawer/__tests__/drawer.test.ts` | 43 | `document.body.innerHTML = '';` |
| `packages/@core/ui-kit/popup-ui/src/drawer/__tests__/use-drawer.test.ts` | 69 | `document.body.innerHTML = '';` |
| `packages/@core/ui-kit/popup-ui/src/modal/__tests__/modal-interaction.test.ts` | 32 | `mainContent.innerHTML = '&lt;div&gt;&lt;div&gt;&lt;/div&gt;&lt;/div&gt;';` |
| `packages/@core/ui-kit/popup-ui/src/modal/__tests__/modal-interaction.test.ts` | 105 | `document.body.innerHTML = '';` |
| `packages/@core/ui-kit/popup-ui/src/modal/__tests__/modal.test.ts` | 22 | `mainContent.innerHTML = '&lt;div&gt;&lt;div&gt;&lt;/div&gt;&lt;/div&gt;';` |
| `packages/@core/ui-kit/popup-ui/src/modal/__tests__/modal.test.ts` | 56 | `document.body.innerHTML = '';` |
| `packages/@core/ui-kit/popup-ui/src/modal/__tests__/modal.test.ts` | 112 | `mainContent.innerHTML = '&lt;div&gt;&lt;div&gt;&lt;/div&gt;&lt;/div&gt;';` |
| `packages/@core/ui-kit/popup-ui/src/modal/__tests__/use-modal.test.ts` | 69 | `document.body.innerHTML = '';` |
| `packages/@core/ui-kit/shadcn-ui/src/ui/progress/__tests__/progress.test.ts` | 43 | `document.body.innerHTML = '';` |
| `packages/effects/common-ui/src/components/icon-picker/__tests__/icon-picker.test.ts` | 57 | `document.body.innerHTML = '';` |
| `packages/effects/common-ui/src/components/loading/directive.ts` | 114 | `style.innerHTML = `` |
| `packages/effects/common-ui/src/ui/dashboard/workbench/workbench-todo.vue` | 47 | `&lt;!-- eslint-disable vue/no-v-html --&gt;` |
| `packages/effects/common-ui/src/ui/dashboard/workbench/workbench-todo.vue` | 50 | `v-html="item.content"` |
| `packages/effects/common-ui/src/ui/dashboard/workbench/workbench-trends.vue` | 48 | `&lt;!-- eslint-disable vue/no-v-html --&gt;` |
| `packages/effects/common-ui/src/ui/dashboard/workbench/workbench-trends.vue` | 51 | `v-html="item.content"` |
| `packages/effects/layouts/src/basic/__tests__/use-layout-scroll.test.ts` | 77 | `document.body.innerHTML = '';` |
| `packages/effects/plugins/src/tiptap/preview.vue` | 28 | `&lt;!-- eslint-disable vue/no-v-html --&gt;` |
| `packages/effects/plugins/src/tiptap/preview.vue` | 32 | `v-html="content"` |

### Client Redirection & PostMessage Sinks (`D2_REDIRECT_AND_POSTMESSAGE` - 共 44 项)

| 文件位置 | 行号 | 代码片段 |
| :--- | :---: | :--- |
| `apps/web-agent/src/api/request.ts` | 83 | `typeof window !== 'undefined' ? window.location?.origin : '',` |
| `apps/web-antd/src/adapter/component/index.ts` | 245 | `window.open(url, '_blank');` |
| `apps/web-antd/src/layouts/basic.vue` | 168 | `window.open(link, '_blank');` |
| `apps/web-antdv-next/src/adapter/component/index.ts` | 262 | `window.open(url, '_blank');` |
| `apps/web-antdv-next/src/adapter/component/index.ts` | 264 | `window.open(file.preview, '_blank');` |
| `apps/web-antdv-next/src/layouts/basic.vue` | 168 | `window.open(link, '_blank');` |
| `apps/web-ele/src/layouts/basic.vue` | 168 | `window.open(link, '_blank');` |
| `apps/web-mch/src/api/request.ts` | 82 | `typeof window !== 'undefined' ? window.location?.origin : '',` |
| `apps/web-mch/src/components/pay/PayTestDrawer.vue` | 227 | `target="_blank"` |
| `apps/web-mch/src/views/cashier/index.vue` | 175 | `return `${window.location.origin}${raw.startsWith('/') ? raw : `/${raw}`}`;` |
| `apps/web-mch/src/views/cashier/index.vue` | 465 | `target="_blank"` |
| `apps/web-mch/src/views/system/userinfo/index.vue` | 78 | `if (parsed.hostname === window.location.hostname) {` |
| `apps/web-mgr/src/api/request.ts` | 82 | `typeof window !== 'undefined' ? window.location?.origin : '',` |
| `apps/web-mgr/src/components/list/PayTestDrawerBase.vue` | 266 | `target="_blank"` |
| `apps/web-mgr/src/views/system/robots/index.vue` | 513 | `target="_blank"` |
| `apps/web-mgr/src/views/system/userinfo/index.vue` | 73 | `if (parsed.hostname === window.location.hostname) {` |
| `apps/web-naive/src/layouts/basic.vue` | 168 | `window.open(link, '_blank');` |
| `apps/web-tdesign/src/layouts/basic.vue` | 168 | `window.open(link, '_blank');` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 6 | `// 保存原始的 window.open 函数` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 7 | `let originalOpen: typeof window.open;` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 10 | `originalOpen = window.open;` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 15 | `window.open = originalOpen;` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 19 | `it('should call window.open with correct arguments', () =&gt; {` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 23 | `window.open = vi.fn();` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 28 | `// 验证 window.open 是否被正确地调用` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 29 | `expect(window.open).toHaveBeenCalledWith(` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 37 | `window.open = vi.fn();` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 40 | `expect(window.open).not.toHaveBeenCalled();` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 43 | `expect(window.open).not.toHaveBeenCalled();` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 46 | `expect(window.open).not.toHaveBeenCalled();` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 50 | `window.open = vi.fn();` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 53 | `expect(window.open).toHaveBeenCalledWith(` |
| `packages/@core/base/shared/src/utils/__tests__/window.test.ts` | 60 | `expect(window.open).toHaveBeenCalledWith(` |
| `packages/@core/base/shared/src/utils/safe-navigation.ts` | 68 | `(typeof window !== 'undefined' ? window.location?.origin : '') \|\|` |
| `packages/@core/base/shared/src/utils/window.ts` | 33 | `window.open(trimmed, target, features);` |
| `packages/effects/common-ui/src/ui/about/about.vue` | 118 | `&lt;a :href="VBEN_GITHUB_URL" class="vben-link" target="_blank"&gt;` |
| `packages/effects/common-ui/src/ui/authentication/dingding-login.vue` | 39 | `return window.location.origin + route.fullPath;` |
| `packages/effects/common-ui/src/ui/authentication/dingding-login.vue` | 72 | `window.location.href = redirectUrl;` |
| `packages/effects/common-ui/src/ui/authentication/dingding-login.vue` | 87 | `window.location.href = `https://login.dingtalk.com/oauth2/auth?redirect_uri=${encodeURIComponent(getRedirectUri())}&response_type=code&client_id=${clientId}&scope=openid&corpid=${corpId}&prompt=consent`;` |
| `packages/effects/layouts/src/basic/copyright/copyright.vue` | 31 | `target="_blank"` |
| `packages/effects/layouts/src/basic/copyright/copyright.vue` | 44 | `target="_blank"` |
| `packages/effects/layouts/src/widgets/check-updates/check-updates.vue` | 33 | `window.location.reload();` |
| `packages/effects/layouts/src/widgets/global-search/search-panel.vue` | 113 | `window.open(to.path, '_blank');` |
| `packages/stores/src/modules/tabbar.ts` | 376 | `openWindow(new URL(href, location.href).href, { target: '_blank' });` |

### Dynamic Router Navigation Sinks (`D3_ROUTER_DYNAMIC_NAVIGATION` - 共 57 项)

| 文件位置 | 行号 | 代码片段 |
| :--- | :---: | :--- |
| `apps/web-agent/src/layouts/basic.vue` | 25 | `router.push('/current/userinfo');` |
| `apps/web-agent/src/store/auth.ts` | 59 | `: await router.push(` |
| `apps/web-agent/src/store/auth.ts` | 94 | `await router.replace({` |
| `apps/web-agent/src/views/dashboard/main/index.vue` | 112 | `router.push(nav.url).catch((error) =&gt; {` |
| `apps/web-agent/src/views/dashboard/workspace/index.vue` | 227 | `router.push(nav.url).catch((error) =&gt; {` |
| `apps/web-antd/src/layouts/basic.vue` | 91 | `router.push({ name: 'Profile' });` |
| `apps/web-antd/src/layouts/basic.vue` | 171 | `router.push({` |
| `apps/web-antd/src/store/auth.ts` | 58 | `: await router.push(` |
| `apps/web-antd/src/store/auth.ts` | 90 | `await router.replace({` |
| `apps/web-antd/src/views/dashboard/workspace/index.vue` | 227 | `router.push(nav.url).catch((error) =&gt; {` |
| `apps/web-antdv-next/src/layouts/basic.vue` | 91 | `router.push({ name: 'Profile' });` |
| `apps/web-antdv-next/src/layouts/basic.vue` | 171 | `router.push({` |
| `apps/web-antdv-next/src/store/auth.ts` | 58 | `: await router.push(` |
| `apps/web-antdv-next/src/store/auth.ts` | 90 | `await router.replace({` |
| `apps/web-antdv-next/src/views/dashboard/workspace/index.vue` | 227 | `router.push(nav.url).catch((error) =&gt; {` |
| `apps/web-ele/src/layouts/basic.vue` | 91 | `router.push({ name: 'Profile' });` |
| `apps/web-ele/src/layouts/basic.vue` | 171 | `router.push({` |
| `apps/web-ele/src/store/auth.ts` | 59 | `: await router.push(` |
| `apps/web-ele/src/store/auth.ts` | 91 | `await router.replace({` |
| `apps/web-ele/src/views/dashboard/workspace/index.vue` | 227 | `router.push(nav.url).catch((error) =&gt; {` |
| `apps/web-mch/src/components/pay/PayTestDrawer.vue` | 137 | `router.push({ path: '/pay', query: { unionOrderId: testOrderNo.value } });` |
| `apps/web-mch/src/layouts/basic.vue` | 25 | `router.push('/current/userinfo');` |
| `apps/web-mch/src/store/auth.ts` | 59 | `: await router.push(` |
| `apps/web-mch/src/store/auth.ts` | 94 | `await router.replace({` |
| `apps/web-mch/src/views/cashier/index.vue` | 169 | `void router.replace({ path: route.path, query: nextQuery });` |
| `apps/web-mch/src/views/dashboard/main/index.vue` | 86 | `router.push(nav.url).catch((error) =&gt; {` |
| `apps/web-mch/src/views/dashboard/workspace/index.vue` | 227 | `router.push(nav.url).catch((error) =&gt; {` |
| `apps/web-mch/src/views/order/pay/index.vue` | 234 | `router.replace({ path: route.path, query: {} });` |
| `apps/web-mgr/src/components/list/PayTestDrawerBase.vue` | 149 | `void router.push({` |
| `apps/web-mgr/src/layouts/basic.vue` | 90 | `void router.push({ path: '/current/userinfo' });` |
| `apps/web-mgr/src/layouts/basic.vue` | 144 | `router.push({` |
| `apps/web-mgr/src/store/auth.ts` | 59 | `: await router.push(` |
| `apps/web-mgr/src/store/auth.ts` | 94 | `await router.replace({` |
| `apps/web-mgr/src/views/dashboard/main/index.vue` | 93 | `router.push(nav.url).catch((error) =&gt; {` |
| `apps/web-mgr/src/views/dashboard/workspace/index.vue` | 227 | `router.push(nav.url).catch((error) =&gt; {` |
| `apps/web-mgr/src/views/order/pay/index.vue` | 527 | `void router.replace({ query: rest });` |
| `apps/web-naive/src/layouts/basic.vue` | 91 | `router.push({ name: 'Profile' });` |
| `apps/web-naive/src/layouts/basic.vue` | 171 | `router.push({` |
| `apps/web-naive/src/store/auth.ts` | 59 | `: await router.push(` |
| `apps/web-naive/src/store/auth.ts` | 91 | `await router.replace({` |
| `apps/web-naive/src/views/dashboard/workspace/index.vue` | 227 | `router.push(nav.url).catch((error) =&gt; {` |
| `apps/web-tdesign/src/layouts/basic.vue` | 91 | `router.push({ name: 'Profile' });` |
| `apps/web-tdesign/src/layouts/basic.vue` | 171 | `router.push({` |
| `apps/web-tdesign/src/store/auth.ts` | 57 | `: await router.push(` |
| `apps/web-tdesign/src/store/auth.ts` | 89 | `await router.replace({` |
| `apps/web-tdesign/src/views/dashboard/workspace/index.vue` | 227 | `router.push(nav.url).catch((error) =&gt; {` |
| `packages/effects/common-ui/src/ui/authentication/code-login.vue` | 83 | `router.push(props.loginPath);` |
| `packages/effects/common-ui/src/ui/authentication/forget-password.vue` | 76 | `router.push(props.loginPath);` |
| `packages/effects/common-ui/src/ui/authentication/login.vue` | 80 | `router.push(path);` |
| `packages/effects/common-ui/src/ui/authentication/qrcode-login.vue` | 68 | `router.push(props.loginPath);` |

> *已截断，前 50 / 57 项已展示，完整数据参见 security-inventory.json*

### Local Storage & Console Leakage Sinks (`D4_STORAGE_AND_LOGGING` - 共 8 项)

| 文件位置 | 行号 | 代码片段 |
| :--- | :---: | :--- |
| `apps/web-mgr/src/components/table/SelectionAutoResetSwitch.vue` | 47 | `const raw = localStorage.getItem(key);` |
| `apps/web-mgr/src/components/table/SelectionAutoResetSwitch.vue` | 59 | `localStorage.setItem(key, value ? '1' : '0');` |
| `apps/web-mgr/src/views/dashboard/main/index.vue` | 181 | `const raw = localStorage.getItem(key);` |
| `apps/web-mgr/src/views/dashboard/main/index.vue` | 191 | `localStorage.setItem(` |
| `apps/web-mgr/src/views/order/pay/index.vue` | 430 | `localStorage.setItem(` |
| `apps/web-mgr/src/views/order/pay/index.vue` | 445 | `const raw = localStorage.getItem(STORAGE_KEY);` |
| `apps/web-mch/src/views/cashier/index.vue` | 159 | `secret = sessionStorage.getItem(cashierSecretStorageKey(mchNo)) ?? '';` |
| `apps/web-mch/src/views/cashier/index.vue` | 164 | `sessionStorage.setItem(cashierSecretStorageKey(mchNo), secret);` |

### Potential Hardcoded Secrets & Token Literals (`D5_HARDCODED_SECRETS_PATTERNS` - 共 3 项)

| 文件位置 | 行号 | 代码片段 |
| :--- | :---: | :--- |
| `apps/backend-mock/utils/jwt-utils.ts` | 11 | `const ACCESS_TOKEN_SECRET = 'access_token_secret';` |
| `apps/backend-mock/utils/jwt-utils.ts` | 12 | `const REFRESH_TOKEN_SECRET = 'refresh_token_secret';` |
| `packages/@core/ui-kit/shadcn-ui/src/components/input-password/input-password.vue` | 40 | `&lt;PasswordStrength :password="modelValue" /&gt;` |

