# Con-Nav-Item - 现代化个人导航站

<div align="center">

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Vue](https://img.shields.io/badge/Vue.js-3-brightgreen.svg)](https://vuejs.org/)

[在线演示](https://nav.166889.xyz) · [部署文档](DEPLOY_SERV00.md) · [备份文档](BACKUP.md) · [问题反馈](https://github.com/zczy-k/Con-Nav-Item/issues)

</div>

> Fork 自 [eooce/nav-item](https://github.com/eooce/nav-item) 并进行了大量增强和优化

## ✨ 特色功能

### 前端特性
- 🏠 **卡片式导航** - 美观现代的导航界面
- 🔍 **聚合搜索** - 支持 Google、百度、Bing、GitHub 等多引擎搜索
- 🎨 **自定义主题** - 渐变背景、毛玻璃效果、一键切换壁纸
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🔗 **友情链接** - 展示和管理友情链接
- 📢 **广告位** - 可选的左右两侧广告展示

### 后台管理
- 👤 **用户管理** - 支持修改用户名和密码
- 📋 **栏目管理** - 主菜单和子菜单的增删改查
- 🃏 **卡片管理** - 导航卡片批量管理，拖拽排序
- 🔍 **搜索引擎** - 自定义搜索引擎配置
- 💾 **自动备份** - 智能增量备份 + 定时备份
- ☁️ **WebDAV备份** - 支持坚果云、Nextcloud 等云备份

### 技术特性
- 🔐 **JWT认证** - 安全的用户认证机制
- 🗄️ **SQLite数据库** - 轻量级，无需额外配置
- 📤 **文件上传** - 支持Logo和图片上传
- 🎯 **PM2部署** - 进程守护，开机自启
- 🐳 **Docker支持** - 容器化部署
- 🔧 **一键部署** - 多平台自动化部署脚本

## 📸 界面预览

<div align="center">
  <img src="https://github.com/user-attachments/assets/91c687a4-0beb-4445-9528-4501d26ddc10" width="800" alt="首页预览" />
  <p><i>首页导航界面</i></p>
  
  <img src="https://github.com/user-attachments/assets/c810c79c-568f-4c19-a059-54ce88ea29d3" width="800" alt="后台管理" />
  <p><i>后台管理界面</i></p>
</div>

## 🚀 快速开始

### 方式一：Linux 服务器一键部署（推荐）

支持 Ubuntu、Debian、CentOS、RHEL、Fedora 等主流发行版。

```bash
# 一键安装（自动安装 Node.js 20 + PM2）
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/install-linux.sh)
```

**自定义安装目录：**
```bash
INSTALL_DIR=/opt/Con-Nav-Item bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/install-linux.sh)
```

**安装后管理命令：**
```bash
pm2 status                # 查看运行状态
pm2 logs Con-Nav-Item     # 查看日志
pm2 restart Con-Nav-Item  # 重启应用
pm2 stop Con-Nav-Item     # 停止应用
```

### 方式二：Docker 部署

#### Docker Run
```bash
docker run -d \
  --name Con-Nav-Item \
  -p 3000:3000 \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/uploads:/app/uploads \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=your_password \
  eooce/Con-Nav-Item
```

#### Docker Compose
```yaml
version: '3'

services:
  Con-Nav-Item:
    image: eooce/Con-Nav-Item
    container_name: Con-Nav-Item
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=your_password
    volumes:
      - ./database:/app/database
      - ./uploads:/app/uploads
    restart: unless-stopped
```

运行：
```bash
docker-compose up -d
```

### 方式三：Serv00 / CT8 / Hostuno 部署

**默认域名安装：**
```bash
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/install-serv00.sh)
```

**自定义域名：**
```bash
DOMAIN=your-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/install-serv00.sh)
```

**重置脚本：**
```bash
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/reset-serv00.sh)
```

### 方式四：源码部署

```bash
# 1. 克隆项目
git clone https://github.com/zczy-k/Con-Nav-Item.git
cd Con-Nav-Item

# 2. 安装后端依赖
npm install

# 3. 构建前端
cd web
npm install
npm run build:prod
cd ..

# 4. 启动应用
npm start
```

## 🎯 访问应用

部署完成后，访问以下地址：

- **首页导航**: `http://your-server:3000`
- **后台管理**: `http://your-server:3000/admin`
- **默认账号**: admin / 123456

> ⚠️ **重要**: 首次登录后请立即修改密码！

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务器端口 | 3000 |
| `ADMIN_USERNAME` | 管理员用户名 | admin |
| `ADMIN_PASSWORD` | 管理员密码 | 123456 |
| `NODE_ENV` | 运行环境 | production |

### 数据存储

- **数据库**: `database/nav.db` (SQLite)
- **上传文件**: `uploads/` 目录
- **备份文件**: `backups/` 目录（本地备份）
- **配置文件**: `config/autoBackup.json` (自动备份配置)

## 💾 备份与恢复

项目内置完善的备份系统，支持本地备份、WebDAV云备份和GitHub备份。

### 快速备份
```bash
# Serv00 用户使用备份管理工具
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/backup-manager.sh)
```

### 后台备份
登录后台管理 → 备份管理：
- **本地备份**: 创建、恢复、下载、删除本地备份
- **WebDAV备份**: 配置并备份到云端（坚果云、Nextcloud等）
- **自动备份**: 配置定时备份和增量备份策略

详细说明: [BACKUP.md](BACKUP.md) | [自动备份策略](BACKUP_STRATEGY.md)

## 🧩 浏览器扩展

将导航站设为浏览器新标签页，打开新标签自动跳转到你的导航站。

### 安装方法
1. 打开 Chrome/Edge 浏览器
2. 访问 `chrome://extensions/` (Edge: `edge://extensions/`)
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `browser-extension` 文件夹
6. 打开新标签页，输入导航站地址并保存

支持: Chrome 88+, Edge 88+, Brave 及其他 Chromium 浏览器

## 📦 项目结构

```
Con-Nav-Item/
├── app.js                  # 后端入口
├── config.js               # 配置文件
├── db.js                   # 数据库初始化
├── routes/                 # API路由
│   ├── auth.js            # 用户认证
│   ├── card.js            # 卡片管理
│   ├── menu.js            # 菜单管理
│   ├── backup.js          # 备份管理
│   └── ...                # 其他路由
├── utils/                  # 工具函数
│   ├── autoBackup.js      # 自动备份
│   └── crypto.js          # 加密工具
├── web/                    # 前端源码
│   ├── src/               # Vue组件
│   └── dist/              # 构建输出
├── public/                 # 静态文件（生产）
├── database/               # SQLite数据库
├── uploads/                # 上传文件
├── config/                 # 配置目录
├── scripts/                # 部署脚本
│   ├── install-linux.sh   # Linux一键部署
│   ├── install-serv00.sh  # Serv00部署
│   └── backup-manager.sh  # 备份管理
├── browser-extension/      # 浏览器扩展
├── Dockerfile              # Docker构建
└── docker-compose.yml      # Docker Compose配置
```

## 🛠️ 开发指南

### 前端开发
```bash
cd web
npm install
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run build:prod   # 构建并复制到public目录
```

### 构建工作流
```bash
# 使用自动化脚本（Windows）
./build.ps1

# 手动构建
cd web && npm run build:prod && cd ..
```

详细说明: [DEV_WORKFLOW.md](DEV_WORKFLOW.md)

## 🔧 工具脚本

### 管理员账号管理
```bash
# 查看当前管理员信息
node check-admin.js

# 重置管理员账号
node reset-admin.js [username] [password]

# 示例：重置为 admin/123456
node reset-admin.js admin 123456
```

## 📚 文档

- [Serv00 部署文档](DEPLOY_SERV00.md)
- [备份与恢复指南](BACKUP.md)
- [自动备份策略](BACKUP_STRATEGY.md)
- [开发工作流程](DEV_WORKFLOW.md)
- [浏览器扩展说明](browser-extension/README.md)

## 🐛 问题反馈

遇到问题？请在 [Issues](https://github.com/zczy-k/Con-Nav-Item/issues) 中反馈。

## 🤝 贡献

欢迎提交 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 了解详情

## 👨‍💻 作者

- **zczy-k** - [GitHub](https://github.com/zczy-k)
- **eooce** (原项目) - [GitHub](https://github.com/eooce)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
