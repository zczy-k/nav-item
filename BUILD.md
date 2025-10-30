# 构建说明

## 📦 项目结构

```
nav-item/
├── web/              # 前端源码（Vue 3）
│   ├── src/         # Vue 组件和页面
│   ├── public/      # 前端静态资源
│   └── dist/        # 构建输出（不提交到 Git）
├── public/          # 编译后的前端文件（提交到 Git）
├── routes/          # 后端 API 路由
├── app.js           # 本地开发入口
├── app.serv00.js    # Serv00 部署入口
└── scripts/         # 部署脚本
```

## 🔨 本地开发

### 后端开发

```bash
# 安装后端依赖
npm install

# 启动后端服务器（端口 3000）
npm start
```

### 前端开发

```bash
# 进入前端目录
cd web

# 安装前端依赖
npm install

# 开发模式（热重载）
npm run dev

# 前端开发服务器通常在端口 5173
```

## 🏗️ 生产构建

### 构建前端

```bash
# 在项目根目录
cd web
npm install
npm run build

# 构建输出在 web/dist/
```

### 复制到 public 目录

```bash
# 回到项目根目录
cd ..

# 删除旧的 public 内容
rm -rf public

# 复制新构建的文件
cp -r web/dist public

# 或者在 Windows PowerShell 中：
# Remove-Item -Path public -Recurse -Force
# Copy-Item -Path web\dist -Destination public -Recurse
```

### 验证构建

```bash
# 检查 public 目录结构
ls -la public/
ls -la public/assets/

# 应该包含：
# - index.html
# - assets/ (CSS 和 JS 文件)
# - background.webp
# - default-favicon.png
# - robots.txt
```

## 📤 提交到 GitHub

```bash
# 添加所有更改
git add .

# 提交（包含编译后的前端文件）
git commit -m "Update with compiled frontend"

# 推送
git push origin main
```

## 🚀 部署到 Serv00

### 方法 1：一键脚本

```bash
DOMAIN=your-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/install-serv00.sh)
```

脚本会自动：
1. 从 GitHub 下载最新代码
2. 安装后端依赖
3. 使用 `app.serv00.js` 配置
4. 启动应用

### 方法 2：手动部署

```bash
# SSH 到 Serv00
ssh your-username@s3.serv00.com

# 进入项目目录
cd ~/domains/your-domain.com/public_nodejs

# 下载代码
curl -sLo nav.zip https://github.com/zczy-k/nav-item/archive/refs/heads/main.zip
unzip -oq nav.zip
cp -r nav-item-main/* .
rm -rf nav-item-main nav.zip

# 使用 Serv00 配置
cp app.serv00.js app.js

# 安装依赖（使用 Node 20）
PATH=/usr/local/devil/node20/bin:$PATH npm install

# 重启
devil www restart your-domain.com
```

## 🔄 更新部署

### 更新代码

```bash
# 本地修改后
git add .
git commit -m "Your changes"
git push

# Serv00 上更新
cd ~/domains/your-domain.com/public_nodejs
curl -sLo nav.zip https://github.com/zczy-k/nav-item/archive/refs/heads/main.zip
unzip -oq nav.zip
cp -r nav-item-main/* .
rm -rf nav-item-main nav.zip
cp app.serv00.js app.js
devil www restart your-domain.com
```

### 仅更新前端

如果只修改了前端：

```bash
# 本地构建
cd web
npm run build
cd ..
rm -rf public
cp -r web/dist public

# 提交
git add public/
git commit -m "Update frontend"
git push

# Serv00 上只需重新下载 public 目录
cd ~/domains/your-domain.com/public_nodejs
curl -sLo nav.zip https://github.com/zczy-k/nav-item/archive/refs/heads/main.zip
unzip -oq nav.zip "nav-item-main/public/*"
cp -r nav-item-main/public/* public/
rm -rf nav-item-main nav.zip
devil www restart your-domain.com
```

## ⚠️ 注意事项

### 为什么提交 public 目录？

- ✅ **Serv00 无法构建前端**：共享主机内存限制，Vite 构建会失败
- ✅ **简化部署**：直接下载即可使用，无需额外构建步骤
- ✅ **稳定性**：确保服务器上的代码与本地一致

### 文件大小

- `public` 目录约 500KB
- 主要是编译后的 JS 文件（已压缩）
- Git LFS 不是必需的

### 构建失败？

如果 `npm run build` 失败：

1. **检查 Node.js 版本**
   ```bash
   node --version  # 应该 >= 14
   ```

2. **清理缓存**
   ```bash
   cd web
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **检查依赖**
   ```bash
   npm audit fix
   ```

## 📝 开发流程总结

### 日常开发

1. 修改前端：编辑 `web/src/` 下的文件
2. 修改后端：编辑 `routes/` 或 `app.js`
3. 测试：`npm start` + `cd web && npm run dev`
4. 构建前端：`cd web && npm run build`
5. 复制：`cp -r web/dist public`
6. 提交：`git add . && git commit && git push`

### 发布流程

1. 确保本地测试通过
2. 构建并提交 public 目录
3. 推送到 GitHub
4. Serv00 上拉取最新代码或重新运行安装脚本

---

**更新日期**: 2025-10-30
