# HTTPS 部署和 Docker 镜像更新指南

## 🔴 当前问题

### 症状
- 网页空白，只显示背景
- 浏览器控制台错误：`Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR`
- 错误文件：`index-DxtRh-uD.js`

### 根本原因

1. **使用了旧版本的 Docker 镜像**
   - 你拉取的 `ghcr.io/zczy-k/con-nav-item:latest` 是旧版本
   - 不包含最新的修复（CSP 配置、SPA Fallback 等）

2. **混合内容错误（Mixed Content Error）**
   - 页面通过 HTTPS 访问（`gh-up.zczy.eu.org` 代理）
   - 但使用的旧镜像可能有 CSP 配置问题
   - 浏览器阻止了不安全的资源加载

---

## ✅ 完整解决方案

### 方案 1: 等待并使用新构建的镜像（推荐）

#### 步骤 1: 检查 GitHub Actions 构建状态

访问：`https://github.com/zczy-k/Con-Nav-Item/actions`

查看最新的 workflow 运行状态：
- ✅ 如果显示绿色勾号，说明构建完成
- ⏳ 如果显示黄色圆圈，说明正在构建（通常需要 5-10 分钟）
- ❌ 如果显示红色叉号，说明构建失败（查看日志）

#### 步骤 2: 等待构建完成后，拉取新镜像

```bash
# 1. 停止并删除旧容器
docker stop Con-Nav-Item
docker rm Con-Nav-Item

# 2. 删除旧镜像（强制使用新版本）
docker rmi ghcr.io/zczy-k/con-nav-item:latest

# 3. 拉取最新镜像
docker pull ghcr.io/zczy-k/con-nav-item:latest

# 4. 运行新容器
docker run -d \
  --name Con-Nav-Item \
  -p 3000:3000 \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/uploads:/app/uploads \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=YourSecurePassword123! \
  -e JWT_SECRET=your-secure-jwt-secret-here \
  -e NODE_ENV=production \
  --restart unless-stopped \
  ghcr.io/zczy-k/con-nav-item:latest
```

**注意**: 不要使用 `gh-up.zczy.eu.org/` 前缀拉取镜像，直接使用 `ghcr.io/`

---

### 方案 2: 手动触发 GitHub Actions 构建

如果构建没有自动开始：

1. 访问 `https://github.com/zczy-k/Con-Nav-Item/actions`
2. 点击左侧 "Build and Push Docker Image"
3. 点击右侧 "Run workflow" 按钮
4. 选择 `main` 分支
5. 点击 "Run workflow"

等待构建完成（5-10 分钟），然后执行方案 1 的步骤 2。

---

### 方案 3: 在本地构建 Docker 镜像（最快）

如果不想等待 GitHub Actions：

```bash
# 1. 克隆最新代码
git clone https://github.com/zczy-k/Con-Nav-Item.git
cd Con-Nav-Item

# 或者如果已有仓库，拉取最新代码
git pull origin main

# 2. 构建镜像
docker build -t con-nav-item:local .

# 3. 停止并删除旧容器
docker stop Con-Nav-Item
docker rm Con-Nav-Item

# 4. 运行新容器（使用本地镜像）
docker run -d \
  --name Con-Nav-Item \
  -p 3000:3000 \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/uploads:/app/uploads \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=YourSecurePassword123! \
  -e JWT_SECRET=your-secure-jwt-secret-here \
  -e NODE_ENV=production \
  --restart unless-stopped \
  con-nav-item:local
```

---

## 🔧 HTTPS 反向代理配置

如果你通过 HTTPS 代理访问（如 `gh-up.zczy.eu.org`），需要正确配置反向代理。

### Nginx 配置示例

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # 重要的代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket 支持（如果需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 缓冲和超时
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Caddy 配置示例

```caddyfile
your-domain.com {
    reverse_proxy localhost:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

---

## 📊 验证新镜像是否正确

### 检查镜像版本

```bash
# 查看镜像的创建时间
docker images ghcr.io/zczy-k/con-nav-item:latest

# 查看镜像的标签和哈希
docker inspect ghcr.io/zczy-k/con-nav-item:latest | grep -A 5 "Created"
```

### 检查容器日志

```bash
# 查看启动日志
docker logs Con-Nav-Item

# 应该看到：
# ⚡ Server is running at http://localhost:3000
# 🔒 Security features enabled: Helmet, Rate Limiting, Input Sanitization
```

### 检查文件是否存在

```bash
# 进入容器检查
docker exec -it Con-Nav-Item sh

# 检查新增的文件
ls -la /app/utils/dbHelpers.js
ls -la /app/web/dist/index.html
ls -la /app/web/dist/assets/

# 退出容器
exit
```

---

## 🐛 浏览器检查清单

访问页面后，按 F12 打开开发者工具：

### Console 标签
- [ ] **没有** CSP 违规错误
- [ ] **没有** ERR_SSL_PROTOCOL_ERROR
- [ ] **没有** 404 错误
- [ ] **没有** JavaScript 执行错误

### Network 标签
检查以下资源的状态码：
- [ ] `index.html` - 状态码 200
- [ ] `index-xxx.js` - 状态码 200（文件名应该是新的）
- [ ] `xxx.css` - 状态码 200
- [ ] `/api/menus` - 状态码 200
- [ ] `/api/cards/1` - 状态码 200

### 正确的文件名
新版本应该包含（文件名哈希可能不同）：
- `index-DsbWGZXC.js` 或类似的新哈希名称
- 如果看到 `index-DxtRh-uD.js`，说明使用的是旧版本

---

## ⚠️ 常见问题

### Q1: 拉取镜像超时或很慢
**解决方案**: 使用 Docker Hub 镜像加速器或改为本地构建

### Q2: GitHub Actions 构建失败
**解决方案**: 
1. 检查 GitHub Actions 日志
2. 确认 Dockerfile 没有语法错误
3. 确认 web 目录可以正常构建

### Q3: 容器启动后立即退出
**解决方案**:
```bash
# 查看错误日志
docker logs Con-Nav-Item

# 常见原因：
# - 数据库初始化失败
# - 权限问题
# - 端口被占用
```

### Q4: HTTPS 下仍然有混合内容错误
**解决方案**:
1. 确认使用的是最新镜像
2. 检查反向代理配置
3. 确认 X-Forwarded-Proto 头正确传递
4. 查看浏览器控制台具体是什么资源被阻止

---

## 📝 环境变量说明

```bash
# 必需的环境变量
ADMIN_USERNAME=admin              # 管理员用户名
ADMIN_PASSWORD=YourPassword       # 管理员密码（建议使用强密码）
JWT_SECRET=your-secret-key        # JWT 密钥（建议生成随机字符串）

# 可选的环境变量
NODE_ENV=production               # 运行环境
PORT=3000                         # 监听端口
CORS_ORIGIN=*                     # CORS 允许的源（生产环境建议指定具体域名）
```

### 生成安全的 JWT_SECRET

```bash
# 方法 1: 使用 openssl
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法 3: 在线生成
# 访问: https://www.grc.com/passwords.htm
```

---

## 🎯 预期结果

使用新镜像后，你应该看到：

1. ✅ 页面正常显示，不再空白
2. ✅ 可以看到导航卡片
3. ✅ 浏览器控制台无错误
4. ✅ API 请求正常响应
5. ✅ HTTPS 访问正常工作
6. ✅ 所有静态资源正确加载

---

## 🚀 快速验证命令

```bash
# 一键验证脚本
echo "=== 检查 Docker 镜像 ==="
docker images | grep con-nav-item

echo -e "\n=== 检查容器状态 ==="
docker ps -a | grep Con-Nav-Item

echo -e "\n=== 检查容器日志（最后 20 行）==="
docker logs --tail 20 Con-Nav-Item

echo -e "\n=== 测试 API 响应 ==="
curl -s http://localhost:3000/api/menus | head -c 100

echo -e "\n=== 检查文件是否存在 ==="
docker exec Con-Nav-Item ls -la /app/utils/dbHelpers.js 2>/dev/null && echo "✅ 新文件存在" || echo "❌ 旧版本镜像"
```

---

## 📞 获取帮助

如果问题仍然存在：

1. **查看完整日志**:
   ```bash
   docker logs -f Con-Nav-Item
   ```

2. **查看 GitHub Actions 日志**:
   访问 `https://github.com/zczy-k/Con-Nav-Item/actions`

3. **进入容器调试**:
   ```bash
   docker exec -it Con-Nav-Item sh
   cd /app
   ls -la
   ```

4. **检查本地代码**:
   确认 `utils/dbHelpers.js` 文件存在

---

## 🎉 总结

**主要问题**: 使用了旧版本的 Docker 镜像

**解决方法**: 
1. 等待 GitHub Actions 构建完成（推荐）
2. 或者在本地构建最新镜像（最快）

**新镜像包含的修复**:
- ✅ 放宽的 CSP 配置
- ✅ 改进的 SPA Fallback
- ✅ 修复的 JWT Secret 配置
- ✅ 优化的代码结构

**预计构建时间**: 5-10 分钟
