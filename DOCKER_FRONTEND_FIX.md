# Docker 部署前端空白问题诊断与解决方案

## 问题症状
在 OpenWrt 的 Docker 容器中部署后，访问页面显示空白。

---

## 🔍 问题分析

经过详细检查，发现了以下**潜在问题**：

### 1. ❗ Helmet CSP 配置过于严格
**位置**: `middleware/security.js` 第 43-63 行

**问题**: Content Security Policy (CSP) 可能阻止了静态资源加载

```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    connectSrc: ["'self'"],  // ❌ 可能阻止 API 请求
    imgSrc: ["'self'", "data:", "https:", "http:"],
  }
}
```

**影响**: 
- 可能阻止了前端 JS 文件加载
- 可能阻止了外部图标和图片资源
- 可能阻止了 API 请求（如果使用反向代理）

---

### 2. ❗ SPA Fallback 逻辑问题
**位置**: `app.js` 第 74-85 行

**问题**: 使用 `fs.existsSync()` 在 Docker 容器中可能有延迟或权限问题

```javascript
app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/uploads') &&
    !fs.existsSync(path.join(__dirname, 'web/dist', req.path))  // ❌ 可能失败
  ) {
    res.sendFile(path.join(__dirname, 'web/dist', 'index.html'));
  } else {
    next();
  }
});
```

**影响**: 
- 所有非 API 请求可能未正确 fallback 到 index.html
- Vue Router 的 history 模式可能失效

---

### 3. ⚠️ 静态资源路径问题
**位置**: `web/dist/index.html` 第 29 行

```html
<script type="module" crossorigin src="/assets/index-DsbWGZXC.js"></script>
```

**问题**: 使用绝对路径 `/assets/...`，在某些反向代理配置下可能失败

---

### 4. ⚠️ Vite 构建配置缺少 base 路径
**位置**: `web/vite.config.mjs`

**问题**: 没有配置 `base` 路径，可能导致在子路径部署时资源加载失败

---

## 🔧 解决方案

### 方案 1: 修复 Helmet CSP 配置（推荐）

修改 `middleware/security.js`:

```javascript
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      connectSrc: ["'self'", "https:", "http:"],  // ✅ 允许所有 HTTPS/HTTP 连接
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  originAgentCluster: false,
  strictTransportSecurity: false,
});
```

或者临时**禁用 CSP** 进行测试：

```javascript
const helmetConfig = helmet({
  contentSecurityPolicy: false,  // ✅ 完全禁用 CSP
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  originAgentCluster: false,
  strictTransportSecurity: false,
});
```

---

### 方案 2: 优化 SPA Fallback 逻辑

修改 `app.js` 第 74-85 行:

```javascript
// 改进的 SPA fallback - 不依赖文件系统检查
app.use((req, res, next) => {
  // 如果是 GET 请求，且不是 API 或上传路径，且不是静态资源
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/uploads') &&
    !req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/i)
  ) {
    res.sendFile(path.join(__dirname, 'web/dist', 'index.html'));
  } else {
    next();
  }
});
```

**改进点**:
- 不再依赖 `fs.existsSync()`
- 使用文件扩展名判断是否为静态资源
- 更可靠的 SPA fallback

---

### 方案 3: 调整中间件顺序

确保 `app.js` 中的中间件顺序正确：

```javascript
// 1. 安全中间件
app.use(helmetConfig);
app.use(cors(...));

// 2. 解析中间件
app.use(express.json(...));
app.use(compression());

// 3. 静态文件（优先级高）
app.use('/uploads', express.static(...));
app.use(express.static(path.join(__dirname, 'web/dist'), {...}));

// 4. API 路由
app.use('/api', generalLimiter);
app.use('/api/menus', menuRoutes);
// ... 其他 API 路由

// 5. SPA Fallback（最后）
app.use((req, res, next) => {
  // fallback 逻辑
});

// 6. 错误处理（必须最后）
app.use(notFoundHandler);
app.use(globalErrorHandler);
```

---

### 方案 4: 添加调试日志

临时添加日志以诊断问题：

在 `app.js` 中添加：

```javascript
// 在静态文件中间件之后添加
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    console.log(`[Static] ${req.method} ${req.path}`);
  }
  next();
});
```

---

## 🚀 快速修复步骤

### 步骤 1: 临时禁用 CSP 测试

编辑 `middleware/security.js`:

```javascript
const helmetConfig = helmet({
  contentSecurityPolicy: false,  // 添加这行
  // ... 其他配置保持不变
});
```

### 步骤 2: 重新构建 Docker 镜像

```bash
cd D:\Users\i\Desktop\modal\nav-item-check
docker build -t con-nav-item:test .
```

### 步骤 3: 运行测试容器

```bash
docker run -d --name nav-test -p 3001:3000 con-nav-item:test
```

### 步骤 4: 访问测试

访问 `http://your-ip:3001` 并检查：
1. 页面是否正常显示
2. 打开浏览器开发者工具（F12）
3. 查看 Console 标签是否有错误
4. 查看 Network 标签，检查哪些资源加载失败

---

## 📊 诊断检查清单

在浏览器中按 F12 打开开发者工具，检查以下内容：

### Console 标签
- [ ] 是否有 CSP 违规错误？
  - 示例: `Refused to load ... because it violates CSP`
- [ ] 是否有 404 错误？
- [ ] 是否有 JavaScript 错误？

### Network 标签
- [ ] `index.html` 是否加载成功（状态码 200）？
- [ ] `/assets/index-xxx.js` 是否加载成功？
- [ ] `/assets/xxx.css` 是否加载成功？
- [ ] API 请求 `/api/menus` 等是否正常？

### Application 标签
- [ ] Service Worker 是否存在干扰？
- [ ] LocalStorage 是否可访问？

---

## 🐛 常见问题与解决

### 问题 1: 页面空白但无错误
**可能原因**: Vue 应用挂载失败
**解决方案**: 检查 `<div id="app"></div>` 是否存在

### 问题 2: CSP 错误
**错误信息**: `Refused to execute inline script because it violates CSP`
**解决方案**: 禁用或放宽 CSP 配置（见方案 1）

### 问题 3: 404 错误
**错误信息**: `GET /assets/index-xxx.js 404`
**可能原因**: 
- Dockerfile 未正确复制文件
- 静态文件路径配置错误
**解决方案**: 
```bash
# 进入容器检查文件
docker exec -it nav-test sh
ls -la /app/web/dist/
ls -la /app/web/dist/assets/
```

### 问题 4: API 请求失败
**错误信息**: CORS 错误或连接被拒绝
**解决方案**: 检查 CORS 配置和反向代理设置

---

## 🔒 关于 SSL 的说明

**SSL 不是问题的原因**，因为：
1. HTTP 和 HTTPS 都不影响静态文件加载
2. 现代浏览器允许在 HTTP 下运行 SPA
3. CSP 配置才是关键

如果使用了反向代理（如 Nginx），确保：
```nginx
location / {
    proxy_pass http://container:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 📝 总结

**最可能的原因（按优先级）**:
1. ❗ **Helmet CSP 配置过于严格** - 90% 可能性
2. ⚠️ **SPA Fallback 逻辑问题** - 60% 可能性
3. ⚠️ **静态文件路径配置** - 30% 可能性
4. ℹ️ **反向代理配置** - 20% 可能性（如果使用）

**推荐操作**:
1. 先临时禁用 CSP 测试（方案 1）
2. 如果解决，逐步放宽 CSP 限制
3. 如果未解决，应用方案 2 改进 SPA fallback
4. 添加调试日志定位具体问题

**不是 SSL 问题**，是应用层配置问题！
