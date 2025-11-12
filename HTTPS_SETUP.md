# HTTPS 配置指南

本项目支持可选的 HTTPS 部署，提供两种证书方案。

## 🚀 快速开始

### 方案一：HTTP 模式（默认）

```bash
# 使用默认 HTTP 模式（端口 3000）
docker run -d \
  --name Con-Nav-Item \
  -p 3000:3000 \
  ghcr.io/zczy-k/con-nav-item:latest
```

访问：`http://你的服务器IP:3000`

---

### 方案二：HTTPS 模式（自签名证书）

```bash
# 启用 HTTPS 模式（HTTP 3000 + HTTPS 3443）
docker run -d \
  --name Con-Nav-Item \
  -p 3000:3000 \
  -p 3443:3443 \
  -e ENABLE_HTTPS=true \
  -v $(pwd)/certs:/app/certs \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/uploads:/app/uploads \
  ghcr.io/zczy-k/con-nav-item:latest
```

**首次启动时会自动生成自签名证书**，浏览器会显示"不安全"警告，点击"高级"→"继续访问"即可。

访问：
- HTTP: `http://你的服务器IP:3000`
- HTTPS: `https://你的服务器IP:3443`

---

### 方案三：HTTPS 模式（自定义证书）

如果你有自己的 SSL 证书（如 Let's Encrypt），可以替换自动生成的证书：

```bash
# 1. 创建证书目录
mkdir -p certs

# 2. 将你的证书文件放入 certs 目录
#    server.crt - 证书文件
#    server.key - 私钥文件
cp your-cert.crt certs/server.crt
cp your-key.key certs/server.key

# 3. 启动容器并挂载证书目录
docker run -d \
  --name Con-Nav-Item \
  -p 3000:3000 \
  -p 3443:3443 \
  -e ENABLE_HTTPS=true \
  -v $(pwd)/certs:/app/certs \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/uploads:/app/uploads \
  ghcr.io/zczy-k/con-nav-item:latest
```

---

## 🔒 使用 Let's Encrypt 免费证书

推荐使用 Certbot 获取免费的受信任证书：

```bash
# 1. 安装 Certbot
sudo apt-get update
sudo apt-get install certbot

# 2. 获取证书（需要有域名）
sudo certbot certonly --standalone -d your-domain.com

# 3. 复制证书到项目目录
mkdir -p certs
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem certs/server.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem certs/server.key
sudo chown $USER:$USER certs/*

# 4. 启动容器
docker run -d \
  --name Con-Nav-Item \
  -p 3000:3000 \
  -p 3443:3443 \
  -e ENABLE_HTTPS=true \
  -v $(pwd)/certs:/app/certs \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/uploads:/app/uploads \
  ghcr.io/zczy-k/con-nav-item:latest
```

---

## ⚙️ 环境变量说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `3000` | HTTP 端口 |
| `HTTPS_PORT` | `3443` | HTTPS 端口 |
| `ENABLE_HTTPS` | `false` | 是否启用 HTTPS |

---

## 📋 证书文件说明

证书文件需放在 `certs/` 目录下：

- `certs/server.crt` - SSL 证书文件
- `certs/server.key` - 私钥文件

**安全提示：** 
- 证书文件已被添加到 `.gitignore`，不会被提交到 Git 仓库
- 请妥善保管私钥文件，不要泄露

---

## 🔧 本地开发

### HTTP 模式
```bash
npm start
```

### HTTPS 模式
```bash
# 设置环境变量并启动
ENABLE_HTTPS=true npm run start:https
```

---

## 🐳 Docker Compose 示例

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  con-nav-item:
    image: ghcr.io/zczy-k/con-nav-item:latest
    container_name: Con-Nav-Item
    ports:
      - "3000:3000"    # HTTP
      - "3443:3443"    # HTTPS
    environment:
      - ENABLE_HTTPS=true
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=your_secure_password
    volumes:
      - ./certs:/app/certs
      - ./database:/app/database
      - ./uploads:/app/uploads
    restart: unless-stopped
```

启动：
```bash
docker-compose up -d
```

---

## ❓ 常见问题

### Q: 浏览器显示"不安全"或 NET::ERR_CERT_AUTHORITY_INVALID

A: 这是使用自签名证书的正常现象。点击"高级"→"继续访问"即可。如需消除警告，请使用 Let's Encrypt 等受信任的证书。

### Q: 如何更新证书？

A: 将新的证书文件复制到 `certs/` 目录，然后重启容器：
```bash
docker restart Con-Nav-Item
```

### Q: 可以只使用 HTTPS 吗？

A: 可以，但不推荐。本项目同时启动 HTTP 和 HTTPS，方便不同场景使用。

### Q: 证书过期了怎么办？

A: 自签名证书有效期 365 天，到期后需重新生成。Let's Encrypt 证书有效期 90 天，建议设置自动续期。

---

## 🔗 相关链接

- [Let's Encrypt 官网](https://letsencrypt.org/)
- [Certbot 文档](https://certbot.eff.org/)
- [OpenSSL 文档](https://www.openssl.org/docs/)
