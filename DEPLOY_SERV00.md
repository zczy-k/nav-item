# Nav-Item Serv00 部署指南

## 重要说明

本项目包含两个版本的 `app.js`：

1. **app.js** - 本地开发版本（使用 `web/dist` 目录）
2. **app.serv00.js** - Serv00 部署版本（使用 `public` 目录）

## 快速部署到 Serv00

### 方法 1：使用一键安装脚本（推荐）

```bash
# 使用默认域名（username.serv00.net）
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/install-serv00.sh)

# 或指定自定义域名
DOMAIN=your-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/install-serv00.sh)
```

**如果遇到问题，按以下步骤手动修复：**

### 方法 2：手动部署修复

#### 1. SSH 登录到 Serv00

```bash
ssh your-username@s3.serv00.com
```

#### 2. 进入项目目录

```bash
cd ~/domains/your-domain.serv00.net/public_nodejs
```

#### 3. 备份并替换 app.js

```bash
# 备份旧文件
cp app.js app.js.backup

# 替换为正确的版本
cat > app.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const menuRoutes = require('./routes/menu');
const cardRoutes = require('./routes/card');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ad');
const friendRoutes = require('./routes/friend');
const userRoutes = require('./routes/user');
const compression = require('compression');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(compression());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/uploads') &&
    !fs.existsSync(path.join(__dirname, 'public', req.path))
  ) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

app.use('/api/menus', menuRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`server is running at http://localhost:${PORT}`);
});
EOF
```

#### 4. 重新安装依赖（使用正确的 Node 版本）

```bash
# 删除旧依赖
rm -rf node_modules package-lock.json

# 使用 Node 20 安装依赖
PATH=/usr/local/devil/node20/bin:$PATH npm install
```

#### 5. 重启应用

```bash
devil www restart your-domain.serv00.net
```

## 常见问题排查

### 问题 1：首页正常但 /admin 报错

**原因：** `app.js` 文件损坏或版本不对

**解决：** 按照上面的步骤 3 重新创建 `app.js`

### 问题 2：依赖安装失败

**原因：** Node 版本不匹配

**解决：** 
```bash
# 确保使用 Node 20
PATH=/usr/local/devil/node20/bin:$PATH npm install
```

### 问题 3：API 请求超时或 502 错误

**原因：** 应用未正常启动

**解决：**
```bash
# 查看错误日志
cat ~/domains/your-domain.serv00.net/logs/error.log

# 完全重建站点
devil www del your-domain.serv00.net
sleep 2
devil www add your-domain.serv00.net nodejs /usr/local/bin/node20
```

### 问题 4：提示找不到模块

**原因：** `node_modules` 不完整或损坏

**解决：**
```bash
# 强制重新安装
rm -rf node_modules package-lock.json
PATH=/usr/local/devil/node20/bin:$PATH npm install --force
```

## 验证部署是否成功

```bash
# 测试 API
curl -X POST https://your-domain.serv00.net/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# 应该返回 JSON 数据（token 或错误信息）
```

## 默认登录信息

访问 `https://your-domain.serv00.net/admin`

- 用户名：`admin`
- 密码：`123456`

**⚠️ 登录后请立即修改密码！**

## 关键注意事项

1. **必须使用 Node 20** 安装依赖（Passenger 配置的是 node20）
2. **不要手动监听特定 IP** - Passenger 会自动处理
3. **app.js 必须完整** - 确保最后有完整的 `});`
4. **旧文件会干扰部署** - 必要时完全删除目录重新安装

## 目录结构

```
public_nodejs/
├── app.js              # 应用入口（必须使用 public 目录）
├── config.js           # 配置文件
├── db.js              # 数据库连接
├── package.json       # 依赖配置
├── database/          # SQLite 数据库
│   └── nav.db
├── node_modules/      # 依赖包
├── public/            # 前端静态文件（编译后）
│   ├── index.html
│   └── assets/
├── routes/            # 路由
│   ├── menu.js
│   ├── card.js
│   └── ...
└── uploads/           # 用户上传文件
```

## 技术栈

- **后端**: Node.js 20 + Express
- **数据库**: SQLite3
- **Web 服务器**: Phusion Passenger + Nginx
- **前端**: Vue.js（已编译到 public/）

## 更多帮助

- 项目地址：https://github.com/zczy-k/nav-item
- 原项目：https://github.com/eooce/nav-item
- Serv00 文档：https://wiki.serv00.com/
- 问题反馈：https://github.com/zczy-k/nav-item/issues
