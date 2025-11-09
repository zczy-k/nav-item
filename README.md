# Con-Nav-Item(增强版) - 个人导航站

> 🔗 **仓库地址**: [github.com/zczy-k/Con-Nav-Item](https://github.com/zczy-k/Con-Nav-Item)  
> 👤 **Fork 自**: [github.com/eooce/nav-item](https://github.com/eooce/nav-item)并进行功能的改进与增强
> 
> ## 增强功能:
- Serv00 一键部署脚本、完善部署文档
- 添加首页添加卡片的功能，方便快捷添加
- 添加背景切换功能
- 添加本地/github配置数据备份功能，方便服务器迁移，防止数据丢失

## 项目简介

一个现代化的导航网站项目，提供简洁美观的导航界面和强大的后台管理系统,快速访问常用网站和工具。

## 🛠️ 技术栈
- Vue 3 + Node.js + SQLite 前后端分离架构

## ✨ 主要功能

### 前端功能
- 🏠 **首页导航**：美观的卡片式导航界面
- 🔍 **聚合搜索**：支持 Google、百度、Bing、GitHub、站内搜索
- 📱 **响应式设计**：完美适配桌面端和移动端
- 🎨 **现代化UI**：采用渐变背景和毛玻璃效果
- 🔗 **友情链接**：支持友情链接展示
- 📢 **广告位**：支持左右两侧广告位展示
- 🧩 **浏览器扩展**：支持将导航站设为新标签页

### 后台管理功能
- 👤 **用户管理**：管理员登录、用户信息管理
- 📋 **栏目管理**：主菜单和子菜单的增删改查
- 🃏 **卡片管理**：导航卡片的增删改查
- 📢 **广告管理**：广告位的增删改查
- 🔗 **友链管理**：友情链接的增删改查
- 📊 **数据统计**：登录时间、IP等统计信息

### 技术特性
- 🔐 **JWT认证**：安全的用户认证机制
- 🗄️ **SQLite数据库**：轻量级数据库，无需额外配置
- 📤 **文件上传**：支持图片上传功能
- 🔍 **搜索功能**：支持站内搜索和外部搜索
- 📱 **移动端适配**：完美的移动端体验

  
### 界面预览
<img width="1891" height="902" alt="image" src="https://github.com/user-attachments/assets/91c687a4-0beb-4445-9528-4501d26ddc10" />
<img width="1909" height="895" alt="image" src="https://github.com/user-attachments/assets/c810c79c-568f-4c19-a059-54ce88ea29d3" />



## 🏗️ 项目结构

```
Con-Nav-Item/
├── app.js                 # 后端主入口文件
├── config.js             # 配置文件
├── db.js                 # 数据库初始化
├── package.json          # 后端依赖配置
├── database/             # 数据库文件目录
│   └── nav.db           # SQLite数据库文件
├── routes/               # 后端路由
│   ├── auth.js          # 认证相关路由
│   ├── menu.js          # 菜单管理路由
│   ├── card.js          # 卡片管理路由
│   ├── ad.js            # 广告管理路由
│   ├── friend.js        # 友链管理路由
│   ├── user.js          # 用户管理路由
│   └── upload.js        # 文件上传路由
├── uploads/              # 上传文件目录
│   └── default-favicon.png
├── web/                  # 前端项目目录
│    ├── package.json      # 前端依赖配置
│    ├── vite.config.mjs   # Vite配置文件
│    ├── index.html        # HTML入口文件
│    ├── public/           # 静态资源
│    │   ├── background.webp
│    │   ├── default-favicon.png
│    │   └── robots.txt
│    └── src/              # 前端源码
│        ├── main.js       # Vue应用入口
│        ├── router.js     # 路由配置
│        ├── api.js        # API接口封装
│        ├── App.vue       # 根组件
│        ├── components/   # 公共组件
│        │   ├── MenuBar.vue
│        │   └── CardGrid.vue
│        └── views/        # 页面组件
│            ├── Home.vue  # 首页
│            ├── Admin.vue # 后台管理
│            └── admin/    # 后台管理子页面
│                ├── MenuManage.vue
│                ├── CardManage.vue
│               ├── AdManage.vue
│               ├── FriendLinkManage.vue
│               └── UserManage.vue
├── Dockerfile # Docker构建文件
```

## ⚙️ 环境变量及配置说明

### 环境变量
- `PORT`: 服务器端口号（默认: 3000）
- `ADMIN_USERNAME`: 管理员用户名（默认: admin）
- `ADMIN_PASSWORD`: 管理员密码（默认: 123456）

### 数据库配置
系统使用 SQLite 数据库，数据库文件会自动创建在项目/database/目录下，使用docker部署请挂载/app/database目录实现数据持久化
```

## 🚀 部署指南

### 源代码部署

#### 1. 克隆项目
```bash
git clone https://github.com/zczy-k/Con-Nav-Item.git
cd Con-Nav-Item
```

#### 2. 安装后端依赖
```bash
npm install
```

#### 3. 构建前端
```bash
cd web && npm install && npm run build
```

#### 4. 启动后端服务
```bash
# 在项目根目录
cd .. && npm start
```

#### 6. 访问应用
- 前端地址：http://localhost:3000
- 后台管理：http://localhost:3000/admin
- 默认管理员账号：admin / 123456

### Docker 部署

#### 1：docker快速部署
   ```bash
   docker run -d \
     --name Con-Nav-Item \
     -p 3000:3000 \
     -v $(pwd)/database:/app/database \
     -v $(pwd)/uploads:/app/uploads \
     -e NODE_ENV=production \
     -e ADMIN_USERNAME=admin \
     -e ADMIN_PASSWORD=123456 \
     eooce/Con-Nav-Item
   ```
### 2: docker-compose.yaml 部署
```bash
version: '3'

services:
  Con-Nav-Item:
    image: eooce/Con-Nav-Item
    container_name: Con-Nav-Item
    ports:
      - "3000:3000"
    environment:
      - PORT=3000             # 监听端口
      - ADMIN_USERNAME=admin  # 后台用户名
      - ADMIN_PASSWORD=123456 # 后台密码
    volumes:
      - ./database:/app/database  # 持久化数据库
    restart: unless-stopped
```
### 3: docker容器等使用docker image配合环境变量部署
```bash
eooce/Con-Nav-Item
```
或
```bash
ghcr.io/eooce/Con-Nav-Item:latest
```

## 🖥️ Linux 服务器一键部署

支持 Ubuntu, Debian, CentOS, RHEL, Fedora 等常见 Linux 发行版。

### 自动安装脚本

**一键安装（自动安装 Node.js + PM2）：**
```bash
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/install-linux.sh)
```

**自定义安装目录：**
```bash
INSTALL_DIR=/opt/Con-Nav-Item bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/install-linux.sh)
```

### 功能特点

- ✅ **自动检测操作系统** - 支持主流 Linux 发行版
- ✅ **自动安装依赖** - Node.js 20 + PM2
- ✅ **交互式配置** - 设置端口、用户名、密码
- ✅ **PM2 进程管理** - 开机自启 + 自动重启
- ✅ **防火墙配置** - 自动配置 UFW/FirewallD

### PM2 常用命令

```bash
pm2 status              # 查看应用状态
pm2 logs Con-Nav-Item   # 查看实时日志
pm2 restart Con-Nav-Item # 重启应用
pm2 stop Con-Nav-Item   # 停止应用
pm2 delete Con-Nav-Item # 删除应用
```

## Serv00 / CT8 / Hostuno 一键部署

### 安装脚本

**使用默认域名（username.serv00.net）：**
```bash
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/install-serv00.sh)
```

**使用自定义域名：**
```bash
DOMAIN=your-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/install-serv00.sh)
```

### 重置脚本

如果需要重新安装或清理旧数据，可以使用重置脚本：

**重置默认域名站点：**
```bash
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/reset-serv00.sh)
```

**重置自定义域名站点：**
```bash
DOMAIN=your-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/reset-serv00.sh)
```

> ⚠️ **注意**：重置脚本将删除所有应用数据、数据库和配置，请谨慎操作！

### 默认账号
- 管理员用户名：`admin`
- 管理员密码：`123456`
- 后台地址：`https://your-domain.com/admin`

> ⚠️ **安全提示**：请在首次登录后立即修改默认密码！

## 💾 数据备份与恢复

### 快速开始

使用统一的备份管理工具，通过交互式菜单完成所有备份和恢复操作：

```bash
# 默认域名
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/backup-manager.sh)

# 自定义域名
DOMAIN=your-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/backup-manager.sh)
```

### 主要功能

- 📦 **本地备份** - 快速创建本地备份，保存在 `~/Con-Nav-Item-backups/`
- 💙 **GitHub 云端备份** - 自动推送到私有 GitHub 仓库
- 🔄 **备份恢复** - 从本地或 GitHub 恢复数据
- 📋 **备份管理** - 查看和管理所有备份
- ⚙️ **配置管理** - GitHub Token 和仓库配置

### 备份内容

- ✅ **database/** - 所有菜单、卡片、用户数据
- ✅ **uploads/** - Logo 和其他上传的图片
- ✅ **.env** - 环境配置（管理员密码等）

### 详细文档

更多使用说明和高级功能，请查看 [BACKUP.md](BACKUP.md)

## 🧩 浏览器扩展

将导航站设为浏览器新标签页，每次打开新标签页自动跳转到你的导航站！

### 功能特点

- ✅ **自动跳转** - 打开新标签页自动跳转到你的导航站
- ✅ **自定义地址** - 支持任意导航站地址
- ✅ **轻量快速** - 仅 50KB，不影响浏览器性能
- ✅ **隐私友好** - 只存储导航站地址，无其他数据收集
- ✅ **跨设备同步** - 通过 Chrome 账号同步设置

### 安装方法

#### 方法1：开发者模式安装（推荐）

1. 打开 Chrome/Edge 浏览器
2. 访问 `chrome://extensions/`（Edge 用户访问 `edge://extensions/`）
3. 开启右上角的“开发者模式”
4. 点击“加载已解压的扩展程序”
5. 选择项目中的 `browser-extension` 文件夹
6. 完成安装！

#### 方法2：从 GitHub 下载

```bash
# 克隆项目
git clone https://github.com/zczy-k/Con-Nav-Item.git
cd Con-Nav-Item/browser-extension
```

然后按照方法1的步骤加载扩展。

### 使用说明

**首次使用：**

1. 安装扩展后，打开新标签页（`Ctrl+T` 或 `Cmd+T`）
2. 输入你的导航站地址（例如：`https://your-domain.com`）
3. 点击“保存并开始使用”
4. 完成！之后每次打开新标签页都会自动跳转

**修改设置：**

1. 右键点击扩展图标
2. 选择“选项”或“设置”
3. 修改导航站地址
4. 点击“保存设置”

### 支持的浏览器

- ✅ Google Chrome 88+
- ✅ Microsoft Edge 88+
- ✅ Brave Browser
- ✅ 其他基于 Chromium 的浏览器

### 详细文档

更多使用说明和常见问题，请查看 [browser-extension/README.md](browser-extension/README.md)

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👨‍💻 作者

**zczy-k** - [GitHub](https://github.com/zczy-k)

原项目作者：**eooce** - [GitHub](https://github.com/eooce)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

⭐ 如果这个项目对你有帮助，请给它一个星标！ 



















