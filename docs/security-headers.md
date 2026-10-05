# AsiaPay Admin 前端生产部署安全响应头配置指南 (Security Headers)

> **适用范围**：本指南针对 AsiaPay Admin 新前端三门户（运营端 `web-mgr`、商户端 `web-mch`、代理端 `web-agent`）的 Nginx 反向代理与网关部署层。
> **责任边界**：本文件属于**部署侧落地**指导，由运维/基础设施人员在生产 Nginx / Ingress 中统一配置。

---

## 1. 核心安全响应头规范

生产环境中，反向代理（如 Nginx / OpenResty）应当在 HTTP 响应中统一注入以下安全头：

```nginx
# 1. 严格内容安全策略 (Content Security Policy)
# 允许加载同源静态资源，允许 API 跨域连接目标网关，禁止外部未知脚本执行
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' http://localhost:* https:; frame-ancestors 'self'; base-uri 'self'; form-action 'self';" always;

# 2. 点击劫持防护 (X-Frame-Options)
# 仅允许同源页面将本系统嵌入 iframe，防止点击劫持攻击
add_header X-Frame-Options "SAMEORIGIN" always;

# 3. MIME 类型嗅探防御 (X-Content-Type-Options)
# 强制浏览器按照声明的 Content-Type 解析，禁止 MIME 嗅探执行脚本
add_header X-Content-Type-Options "nosniff" always;

# 4. 引用来源策略 (Referrer-Policy)
# 跨域或降级时不泄露敏感 Path 与 Query（保护 token/orderId 等参数）
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# 5. 浏览器特性权限控制 (Permissions-Policy)
# 禁用无用的敏感硬件权限（摄像头、麦克风、地理定位、传感器等）
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=()" always;

# 6. 传输层安全强化 (HSTS - 仅 HTTPS 环境启用)
# 强制客户端使用 HTTPS 通信，防止 SSL Stripping 中间人劫持
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 2. 三门户 Nginx 虚拟主机参考配置

```nginx
# AsiaPay 运营端 (web-mgr - 默认 5666)
server {
    listen 80;
    server_name mgr.asiapay.internal;
    root /var/www/asiapay-admin/apps/web-mgr/dist;
    index index.html;

    # 注入安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SPA 路由兜底
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 网关代理
    location /api/ {
        proxy_pass http://127.0.0.1:8090/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 禁止访问源码映射文件与隐藏文件
    location ~* \.(map|git|env|bak)$ {
        deny all;
        return 404;
    }
}
```

---

## 3. 开发环境与生产环境差异说明

| 安全维度 | 开发环境 (Vite Dev Server) | 生产环境 (Nginx / CDN) |
| :--- | :--- | :--- |
| **CSP 策略** | Vite HMR 与样式热加载需要 `'unsafe-inline'`，不可在开发端强加严格 CSP | 生产打包为静态 chunk，建议配合严谨的 script-src/connect-src |
| **SourceMap** | 构建已默认设置 `sourcemap: false`，开发环境仅在内存中处理 | 严禁将 `.map` 文件部署至公网服务器，Nginx 必须拦截 `.map` 请求 |
| **Console 日志** | 保留开发调试输出 | 生产构建通过 oxc (Vite 8) 自动剥离 `console.log` 与 `debugger` |
| **代理 (Proxy)** | `vite.config.ts` 中的 `server.proxy` 仅在开发阶段生效 | 生产构建产物无本地 proxy 依赖，统一由 Nginx `location /api/` 处理 |
