# 开发工作流程

## 🚀 前端修改后的部署流程

当修改前端代码后，**必须**构建并复制到 `public/` 目录才能在服务器生效。

### 方法1：使用根目录构建脚本（推荐）

```powershell
# Windows PowerShell
./build.ps1
```

```bash
# Linux/Mac
chmod +x build.sh
./build.sh
```

这个脚本会自动：
1. 构建前端（`npm run build:prod`）
2. 复制 `web/dist/` 到 `public/`
3. 提示你下一步的 git 命令

### 方法2：手动运行

```bash
cd web
npm run build:prod
cd ..
```

`build:prod` 命令会自动执行构建和复制两个步骤。

## 📝 完整的开发-部署流程

```bash
# 1. 修改前端代码
# 编辑 web/src/ 下的文件

# 2. 构建并复制（二选一）
./build.ps1              # 方法1：使用脚本
cd web && npm run build:prod && cd ..  # 方法2：手动

# 3. 提交代码
git add .
git commit -m "feat: 你的修改描述"
git push origin main

# 4. 服务器部署
# 使用部署脚本会自动拉取最新代码和 public 目录
```

## ⚠️ 重要提醒

- **必须复制到 public/**：服务器读取的是 `public/` 目录，不是 `web/dist/`
- **每次前端修改都要构建**：Vue 是编译型框架，修改源码后必须重新构建
- **提交时包含 public/**：确保 `public/` 目录的更改也被提交到 Git

## 🔧 项目结构

```
nav-item-check/
├── web/                    # 前端源代码
│   ├── src/               # Vue 源代码（开发时修改这里）
│   ├── dist/              # 构建输出（git 追踪）
│   └── package.json       # 包含 build:prod 脚本
├── public/                # 服务器静态文件目录（生产环境）
│   └── [构建后的文件]     # 从 web/dist/ 复制而来
├── build.ps1              # Windows 构建脚本
└── build.sh               # Linux/Mac 构建脚本
```

## 🎯 快速检查清单

修改前端代码后，确保完成：
- [ ] 运行 `./build.ps1` 或 `npm run build:prod`
- [ ] 确认 `public/` 目录已更新
- [ ] `git add .` 包含 public/ 的更改
- [ ] 提交并推送到仓库
- [ ] 在服务器运行部署脚本
