# Fly.io 部署指南

Fly.io 是一个全球边缘计算平台，可将应用部署到离用户最近的数据中心，提供极低延迟的访问体验。

---

## ✨ Fly.io 优势

- ✅ **全球边缘部署** - 30+ 数据中心，就近访问
- ✅ **持久化存储** - Volumes 支持 SQLite
- ✅ **自动 HTTPS** - 免费 SSL 证书
- ✅ **零停机部署** - 滚动更新，无中断
- ✅ **免费额度** - 3个小型应用 + 3GB 存储
- ✅ **Docker 原生** - 使用项目现有的 Dockerfile

---

## 🚀 快速部署

### 前置准备

1. **安装 Fly CLI**

**macOS/Linux**:
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows** (PowerShell):
```powershell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

2. **登录 Fly.io**
```bash
fly auth login
```

---

### 步骤 1: 初始化应用

在项目根目录执行：

```bash
# 克隆项目（如果还没有）
git clone https://github.com/zczy-k/Con-Nav-Item.git
cd Con-Nav-Item

# 初始化 Fly.io 应用
fly launch --no-deploy
```

CLI 会询问：
- **App name**: 输入应用名称（如 `my-nav-site`）
- **Region**: 选择地区（推荐: `hkg` 香港 / `sin` 新加坡 / `nrt` 东京）
- **Database**: 选择 **No**（我们使用 SQLite）
- **Deploy now**: 选择 **No**（先配置 Volume）

---

### 步骤 2: 创建持久化存储卷

SQLite 需要持久化存储，创建 Volume：

```bash
fly volumes create con_nav_data \
  --region hkg \
  --size 1
```

参数说明：
- `con_nav_data`: 卷名称（与 `fly.toml` 中的 `source` 对应）
- `--region hkg`: 地区（必须与应用相同）
- `--size 1`: 大小 1GB（免费）

---

### 步骤 3: 配置环境变量

```bash
# 设置管理员账号
fly secrets set ADMIN_USERNAME=admin
fly secrets set ADMIN_PASSWORD=your_secure_password

# 设置 JWT 密钥（必须）
fly secrets set JWT_SECRET=$(openssl rand -base64 32)

# 设置数据目录（Volume 挂载点）
fly secrets set DATA_DIR=/app/data
```

---

### 步骤 4: 部署应用

```bash
fly deploy
```

部署过程：
1. 构建 Docker 镜像（使用项目的 Dockerfile）
2. 推送镜像到 Fly.io Registry
3. 在指定地区启动容器
4. 挂载 Volume 到 `/app/data`
5. 运行健康检查

---

## 📁 数据持久化

Fly.io Volume 挂载到 `/app/data`，数据结构：

```
/app/data/
├── database/       # SQLite 数据库
│   └── nav.db
├── uploads/        # 上传的图片
├── backups/        # 本地备份
└── config/         # 自动备份配置
```

---

## 🌍 多地区部署（可选）

部署到多个地区以提升全球访问速度：

```bash
# 添加更多地区
fly scale count 2 --region hkg,sin

# 或者指定具体地区
fly scale count 1 --region nrt  # 东京
fly scale count 1 --region lax  # 洛杉矶
fly scale count 1 --region fra  # 法兰克福
```

**注意**: 每个地区需要独立的 Volume：
```bash
fly volumes create con_nav_data --region sin --size 1
fly volumes create con_nav_data --region nrt --size 1
```

---

## 🔧 常用命令

### 查看应用状态
```bash
fly status
```

### 查看日志
```bash
fly logs

# 实时日志
fly logs --follow
```

### 查看资源使用
```bash
fly dashboard
```

### 打开应用
```bash
fly open

# 打开后台管理
fly open /admin
```

### SSH 进入容器
```bash
fly ssh console

# 进入后查看数据
ls -la /app/data
```

### 查看 Volume
```bash
fly volumes list
```

### 扩容/缩容
```bash
# 修改实例大小
fly scale vm shared-cpu-1x --memory 512

# 修改实例数量
fly scale count 2
```

---

## 🔄 更新应用

### 方法 1: 自动部署（推荐）

推送代码后手动部署：
```bash
git pull
fly deploy
```

### 方法 2: GitHub Actions 自动部署

创建 `.github/workflows/fly-deploy.yml`:
```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

获取 API Token:
```bash
fly tokens create deploy
```

将 Token 添加到 GitHub Secrets（Settings → Secrets → FLY_API_TOKEN）。

---

## 💰 费用说明

### 免费额度

- ✅ 3个小型应用（shared-cpu-1x, 256MB）
- ✅ 160GB 流量/月
- ✅ 3GB 持久化存储
- ✅ 无限制的 IPv6 流量

### 计费规则

**超出免费额度后**:
- CPU: $0.0000008/秒 (~$1.94/月，shared-cpu-1x)
- 内存: $0.0000022/MB/秒 (~$0.15/GB/月)
- 存储: $0.15/GB/月
- IPv4: $2/月（可选）
- 流量: $0.02/GB（超出免费额度）

**预估成本**（小型项目，24/7运行）:
- 1个实例（256MB）: 免费
- 1GB 存储: 免费
- 预估流量: 免费
- **总计**: $0/月 ✅

---

## 🔐 安全配置

### 1. 启用 HTTPS（自动）

Fly.io 自动提供 HTTPS 证书，`fly.toml` 中已配置：
```toml
[http_service]
  force_https = true
```

### 2. 自定义域名

```bash
# 添加自定义域名
fly certs create nav.yourdomain.com

# 查看 DNS 配置信息
fly certs show nav.yourdomain.com
```

在你的 DNS 提供商添加：
```
Type: CNAME
Name: nav
Value: <your-app>.fly.dev
```

### 3. 防火墙（默认安全）

Fly.io 默认配置：
- 只暴露 `http_service` 定义的端口
- 自动 DDoS 防护
- 全球 Anycast 网络

---

## 🛠️ 故障排查

### 问题 1: 部署失败

**症状**: `fly deploy` 失败

**解决**:
```bash
# 查看详细日志
fly logs

# 检查构建日志
fly deploy --verbose

# 检查 Dockerfile
fly launch --dockerfile Dockerfile
```

### 问题 2: 数据库丢失

**症状**: 重启后数据清空

**解决**:
```bash
# 确认 Volume 已创建并挂载
fly volumes list

# 检查挂载配置
fly ssh console
ls -la /app/data

# 如果没有挂载，重新创建 Volume
fly volumes create con_nav_data --region hkg --size 1
```

### 问题 3: 应用无法访问

**症状**: 域名打不开或 502 错误

**解决**:
```bash
# 检查应用状态
fly status

# 查看健康检查
fly checks list

# 重启应用
fly restart

# 查看实时日志
fly logs --follow
```

### 问题 4: 内存不足

**症状**: 应用频繁重启，OOM 错误

**解决**:
```bash
# 扩容到 512MB
fly scale memory 512

# 或升级到更大实例
fly scale vm shared-cpu-2x --memory 1024
```

---

## 📊 监控和告警

### 查看 Metrics

```bash
# 打开 Dashboard
fly dashboard

# 或访问
https://fly.io/apps/<your-app>/metrics
```

### 设置告警（Pro 功能）

在 Fly.io Dashboard 配置：
- CPU 使用率告警
- 内存使用率告警
- 健康检查失败告警

---

## 🔄 备份和恢复

### 手动备份

```bash
# SSH 进入容器
fly ssh console

# 在容器内压缩数据
cd /app/data
tar -czf backup-$(date +%Y%m%d).tar.gz database/ uploads/

# 退出容器
exit

# 从容器复制备份到本地
fly ssh sftp shell
get /app/data/backup-*.tar.gz
```

### 使用 WebDAV 自动备份

在应用中配置 WebDAV 备份（坚果云、Nextcloud 等），详见 [BACKUP.md](BACKUP.md)。

---

## 📞 支持

- **Fly.io 文档**: https://fly.io/docs
- **社区论坛**: https://community.fly.io
- **项目 Issues**: https://github.com/zczy-k/Con-Nav-Item/issues

---

## 🎉 完成

部署完成后，你的导航站将运行在 Fly.io 全球网络上：

```
https://your-app.fly.dev
```

访问后台管理：`https://your-app.fly.dev/admin`

默认账号：`admin` / `your_secure_password`

---

## 🌟 推荐地区选择

### 中国用户
- **首选**: `hkg` (香港) - 延迟最低
- **备选**: `sin` (新加坡)、`nrt` (东京)

### 欧美用户
- **北美**: `lax` (洛杉矶)、`iad` (华盛顿)
- **欧洲**: `fra` (法兰克福)、`lhr` (伦敦)

### 查看所有地区
```bash
fly platform regions
```

---

**下一步**: [配置备份](BACKUP.md) | [安全加固](SECURITY_AUDIT.md) | [自定义域名](#2-自定义域名)
