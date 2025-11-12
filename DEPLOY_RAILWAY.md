# Railway 部署指南

Railway 是一个现代化的应用部署平台，支持从 GitHub 直接部署，提供自动 HTTPS、持久化存储等功能。

---

## ✨ Railway 优势

- ✅ **零配置部署** - 自动检测 Node.js 项目
- ✅ **持久化存储** - 支持 SQLite 数据库持久化
- ✅ **自动 HTTPS** - 免费 SSL 证书
- ✅ **GitHub 集成** - 推送代码自动部署
- ✅ **免费额度** - 每月 $5 免费额度
- ✅ **快速启动** - 容器启动快，无冷启动

---

## 🚀 快速部署

### 方式一：一键部署（推荐）

1. **点击部署按钮**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/con-nav-item?referralCode=YOUR_CODE)

2. **配置环境变量**（可选）
   - `ADMIN_USERNAME`: 管理员用户名（默认: admin）
   - `ADMIN_PASSWORD`: 管理员密码（默认: 123456）
   - `JWT_SECRET`: JWT 密钥（自动生成）

3. **等待部署完成**（约 2-3 分钟）

4. **访问应用**
   - 点击 Railway 提供的域名即可访问

---

### 方式二：从 GitHub 部署

#### 步骤 1: 注册 Railway 账号

访问 [railway.app](https://railway.app) 并使用 GitHub 账号登录。

#### 步骤 2: 创建新项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 授权 Railway 访问你的 GitHub
4. 选择 `Con-Nav-Item` 仓库

#### 步骤 3: 配置环境变量

在 Railway 项目设置中添加：

```env
PORT=3000
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
```

> 💡 **提示**: `JWT_SECRET` 可以用以下命令生成：
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
> ```

#### 步骤 4: 添加持久化存储（重要）

Railway 默认使用临时文件系统，需要添加 Volume 来持久化 SQLite 数据库。

1. 进入项目 → Settings → Volumes
2. 点击 "Add Volume"
3. 配置：
   - **Mount Path**: `/app/data`
   - **Size**: 1 GB（免费）

#### 步骤 5: 部署

Railway 会自动检测到 `railway.json` 配置文件并开始部署。

---

## 📁 数据持久化

Railway Volume 会挂载到 `/app/data`，项目会自动将以下数据存储到该目录：

```
/app/data/
├── database/       # SQLite 数据库
│   └── nav.db
├── uploads/        # 上传的图片文件
├── backups/        # 本地备份文件
└── config/         # 自动备份配置
```

---

## 🔧 自定义配置

### 修改端口

编辑环境变量中的 `PORT`，Railway 会自动更新。

### 自定义域名

1. 进入项目 → Settings → Domains
2. 点击 "Add Domain"
3. 输入你的域名（需要在 DNS 设置 CNAME）

### 扩容资源

Railway 免费版限制：
- CPU: 共享
- 内存: 512MB
- 磁盘: 1GB

如需更多资源，可升级到 Pro 计划（$20/月）。

---

## 📊 监控和日志

### 查看日志

1. 进入项目 → Deployments
2. 点击最新的部署
3. 查看实时日志输出

### 查看指标

1. 进入项目 → Metrics
2. 查看 CPU、内存、网络使用情况

---

## 🔄 更新应用

### 自动更新（推荐）

推送代码到 GitHub，Railway 会自动检测并重新部署。

```bash
git add .
git commit -m "Update app"
git push
```

### 手动触发部署

1. 进入项目 → Deployments
2. 点击 "Redeploy"

---

## 💰 费用说明

### 免费额度

- ✅ $5 免费额度/月
- ✅ 500 小时执行时间
- ✅ 1GB 存储空间
- ✅ 100GB 流量

### 计费规则

- CPU: $0.000463/分钟
- 内存: $0.000231/GB-分钟
- 流量: $0.10/GB（超出 100GB）

**预估成本**（小型项目）:
- 24/7 运行: ~$3-5/月
- 按需运行: 免费（在免费额度内）

---

## 🛠️ 故障排查

### 问题 1: 部署失败

**症状**: 构建失败或启动失败

**解决**:
1. 检查日志中的错误信息
2. 确认 `package.json` 中的 `engines` 字段
3. 确认所有依赖都在 `dependencies` 中

### 问题 2: 数据丢失

**症状**: 每次重启后数据清空

**解决**:
1. 检查是否已添加 Volume
2. 确认 Mount Path 为 `/app/data`
3. 检查环境变量 `DATA_DIR` 是否正确

### 问题 3: 应用无法访问

**症状**: 域名无法打开

**解决**:
1. 检查应用是否成功启动（查看日志）
2. 确认端口配置正确（使用 Railway 提供的 `PORT` 环境变量）
3. 检查防火墙和安全组设置

### 问题 4: 数据库锁定

**症状**: `database is locked` 错误

**解决**:
```bash
# 在 Railway Shell 中执行
cd /app/data/database
rm nav.db-shm nav.db-wal
```

---

## 🔐 安全建议

1. **修改默认密码**
   - 首次登录后立即修改管理员密码

2. **使用强 JWT 密钥**
   - 设置随机生成的 `JWT_SECRET`

3. **定期备份**
   - 使用内置的 WebDAV 备份功能
   - 定期下载 Railway Volume 备份

4. **启用 HTTPS**
   - Railway 默认启用 HTTPS
   - 强制重定向到 HTTPS

---

## 📞 支持

- **Railway 文档**: https://docs.railway.app
- **项目 Issues**: https://github.com/zczy-k/Con-Nav-Item/issues
- **Railway 社区**: https://discord.gg/railway

---

## 🎉 完成

部署完成后，你的导航站将运行在 Railway 提供的域名上，例如：

```
https://con-nav-item-production.up.railway.app
```

访问后台管理：`https://your-domain/admin`

默认账号：`admin` / `123456`（请立即修改）

---

**下一步**: [配置备份](BACKUP.md) | [安全加固](SECURITY_AUDIT.md) | [自定义域名](https://docs.railway.app/deploy/exposing-your-app#custom-domains)
