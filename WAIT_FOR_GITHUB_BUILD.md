# 等待 GitHub Actions 构建并部署指南

## ✅ 是的！你可以等待 GitHub Actions 构建

你的仓库有自动构建配置，当推送代码到 `main` 分支时会自动构建 Docker 镜像。

---

## 📊 检查构建状态

### 方法 1: 访问 GitHub Actions 页面

1. 打开浏览器，访问：
   ```
   https://github.com/zczy-k/Con-Nav-Item/actions
   ```

2. 查看最新的 workflow 运行：
   - ✅ **绿色勾号** = 构建成功
   - ⏳ **黄色圆圈** = 正在构建（通常 5-10 分钟）
   - ❌ **红色叉号** = 构建失败

3. 点击 workflow 可以查看详细日志

### 方法 2: 使用 GitHub CLI（如果已安装）

```bash
gh run list --repo zczy-k/Con-Nav-Item --limit 5
```

### 方法 3: 查看最新的镜像标签

访问 GitHub Container Registry：
```
https://github.com/zczy-k/Con-Nav-Item/pkgs/container/con-nav-item
```

查看最新镜像的构建时间和 SHA 标签。

---

## ⏰ 需要触发的提交

你的代码修改（提交 `1d5a62d`）包含：
- ✅ `app.js` - 触发构建
- ✅ `middleware/security.js` - 触发构建
- ✅ `routes/**` - 触发构建
- ✅ `utils/dbHelpers.js` - 触发构建

**GitHub Actions 应该已经自动触发构建！**

---

## 🚀 构建完成后部署（推荐方法）

### 步骤 1: 等待构建完成

访问 https://github.com/zczy-k/Con-Nav-Item/actions

等待最新的 workflow 运行完成（绿色勾号）。

### 步骤 2: 在你的 OpenWrt 上执行以下命令

```bash
# 2.1 停止并删除旧容器
docker stop Con-Nav-Item
docker rm Con-Nav-Item

# 2.2 删除旧镜像（重要！强制拉取新版本）
docker rmi ghcr.io/zczy-k/con-nav-item:latest

# 2.3 拉取最新镜像
docker pull ghcr.io/zczy-k/con-nav-item:latest

# 2.4 验证镜像信息
docker images ghcr.io/zczy-k/con-nav-item:latest
# 查看 CREATED 列，应该显示几分钟前

# 2.5 启动新容器
docker run -d \
  --name Con-Nav-Item \
  -p 3000:3000 \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/uploads:/app/uploads \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=YourSecurePassword123! \
  -e JWT_SECRET=your-secure-jwt-secret \
  -e NODE_ENV=production \
  --restart unless-stopped \
  ghcr.io/zczy-k/con-nav-item:latest
```

### 步骤 3: 验证新镜像

```bash
# 检查新文件是否存在
docker exec Con-Nav-Item ls -la /app/utils/dbHelpers.js
# 应该显示文件信息 ✅

# 检查 CSP 配置
docker exec Con-Nav-Item grep -A 2 "connectSrc" /app/middleware/security.js
# 应该看到：connectSrc: ["'self'", "https:", "http:"]

# 检查前端文件
docker exec Con-Nav-Item ls /app/web/dist/assets/index*.js
# 应该看到：index-DsbWGZXC.js（新版本）

# 查看容器日志
docker logs Con-Nav-Item
```

### 步骤 4: 清空浏览器缓存并访问

**非常重要！** 即使使用了新镜像，浏览器可能还在使用缓存。

- **硬刷新**: `Ctrl + Shift + R` (Windows/Linux) 或 `Cmd + Shift + R` (Mac)
- **或者使用无痕窗口**: `Ctrl + Shift + N`

---

## 🔄 如果构建失败或未触发

### 手动触发构建

1. 访问：https://github.com/zczy-k/Con-Nav-Item/actions
2. 点击左侧 "Build and Push Docker Image"
3. 点击右侧 "Run workflow" 按钮
4. 选择 `main` 分支
5. 点击绿色的 "Run workflow" 按钮

等待 5-10 分钟构建完成。

---

## 📋 完整的验证检查清单

### 在部署之前

- [ ] GitHub Actions 构建状态为绿色勾号
- [ ] 最新镜像的时间戳是最近的（几分钟前）

### 在部署之后

- [ ] 容器成功启动（`docker ps` 显示 Up 状态）
- [ ] 新文件存在：`docker exec Con-Nav-Item ls /app/utils/dbHelpers.js`
- [ ] CSP 配置正确：包含 `"https:", "http:"`
- [ ] 前端文件是新版本：`index-DsbWGZXC.js`
- [ ] API 正常响应：`curl http://localhost:3000/api/menus`

### 在浏览器中

- [ ] 清空缓存后访问
- [ ] F12 开发者工具 Console 无错误
- [ ] Network 标签显示加载的是 `index-DsbWGZXC.js`
- [ ] 页面正常显示导航卡片

---

## 🕐 时间线参考

| 步骤 | 预计时间 |
|------|----------|
| GitHub Actions 构建 | 5-10 分钟 |
| 拉取镜像 (ghcr.io) | 1-3 分钟 |
| 容器启动 | 5-10 秒 |
| **总计** | **约 6-13 分钟** |

---

## 🎯 为什么推荐等待 GitHub Actions 构建？

### 优点
✅ **自动化** - 无需手动构建  
✅ **一致性** - 在标准的 GitHub 环境中构建  
✅ **可追溯** - 每次构建都有日志和标签  
✅ **方便** - 任何地方都能拉取相同的镜像  
✅ **节省资源** - 不占用你的 OpenWrt 资源

### 何时选择本地构建
- ❌ GitHub Actions 构建失败
- ❌ 需要立即测试（不想等待）
- ❌ 对 Dockerfile 做了自定义修改
- ❌ 网络问题导致无法拉取镜像

---

## 🔍 检查 GitHub Actions 是否成功构建

### 查看最新构建的镜像标签

```bash
# 方法 1: 通过 GitHub API
curl -s https://api.github.com/users/zczy-k/packages/container/con-nav-item/versions \
  | grep -o '"created_at":"[^"]*"' | head -1

# 方法 2: 拉取并检查镜像
docker pull ghcr.io/zczy-k/con-nav-item:latest
docker inspect ghcr.io/zczy-k/con-nav-item:latest | grep Created

# 方法 3: 检查特定 SHA 标签
# 从 GitHub Actions 页面获取最新的 commit SHA
docker pull ghcr.io/zczy-k/con-nav-item:1d5a62d
```

---

## ⚠️ 常见问题

### Q1: 拉取镜像时报 "unauthorized" 错误

**原因**: GitHub Container Registry 可能需要认证（如果包是私有的）

**解决**:
```bash
# 使用 GitHub Personal Access Token 登录
echo $YOUR_TOKEN | docker login ghcr.io -u zczy-k --password-stdin

# 然后再拉取
docker pull ghcr.io/zczy-k/con-nav-item:latest
```

### Q2: 镜像很大，拉取很慢

**解决**:
- 使用 Docker Hub 镜像加速器
- 或者改为本地构建

### Q3: 拉取的镜像还是旧版本

**原因**: Docker 缓存或 GitHub Actions 构建尚未完成

**解决**:
```bash
# 1. 确认 GitHub Actions 已经完成
# 访问 https://github.com/zczy-k/Con-Nav-Item/actions

# 2. 强制删除本地镜像
docker rmi -f ghcr.io/zczy-k/con-nav-item:latest

# 3. 重新拉取
docker pull ghcr.io/zczy-k/con-nav-item:latest

# 4. 检查镜像创建时间
docker images | grep con-nav-item
```

---

## 🎉 成功标志

当一切正确时，你会看到：

### Docker 端
```bash
$ docker exec Con-Nav-Item ls /app/utils/dbHelpers.js
-rw-r--r--    1 root     root          3489 Nov 12 02:00 /app/utils/dbHelpers.js

$ docker exec Con-Nav-Item ls /app/web/dist/assets/index*.js
/app/web/dist/assets/index-DsbWGZXC.js  # ← 新版本！
```

### 浏览器端
- ✅ 页面正常显示
- ✅ 可以看到导航卡片
- ✅ Console 无错误
- ✅ Network 加载的是 `index-DsbWGZXC.js`

---

## 📞 需要帮助？

如果等待 GitHub Actions 构建后问题仍然存在，请提供：

1. **GitHub Actions 日志**
   - 访问 https://github.com/zczy-k/Con-Nav-Item/actions
   - 点击最新的 workflow
   - 复制 "Build and push Docker image" 步骤的输出

2. **验证结果**
   ```bash
   docker exec Con-Nav-Item ls -la /app/utils/
   docker exec Con-Nav-Item ls /app/web/dist/assets/index*.js
   docker exec Con-Nav-Item cat /app/middleware/security.js | grep -A 5 "connectSrc"
   ```

3. **浏览器截图**
   - F12 开发者工具 Console 标签
   - Network 标签（显示加载的 JS 文件）

---

## 🚀 快速开始

```bash
# 一键部署脚本（等待构建完成后执行）

# 清理旧容器和镜像
docker stop Con-Nav-Item && docker rm Con-Nav-Item
docker rmi ghcr.io/zczy-k/con-nav-item:latest

# 拉取最新镜像
docker pull ghcr.io/zczy-k/con-nav-item:latest

# 启动
docker run -d --name Con-Nav-Item -p 3000:3000 \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/uploads:/app/uploads \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=YourPassword \
  -e JWT_SECRET=$(openssl rand -base64 32) \
  --restart unless-stopped \
  ghcr.io/zczy-k/con-nav-item:latest

# 验证
docker exec Con-Nav-Item ls /app/utils/dbHelpers.js
docker logs Con-Nav-Item

# 然后清空浏览器缓存访问！
```

---

**推荐：等待 GitHub Actions 构建，然后拉取最新镜像！**

这是最简单、最可靠的方法！🎯
