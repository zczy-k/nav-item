# 项目修改总结

## 最新更新 (2025-10-30)

### 仓库信息更新
- **新仓库地址**: https://github.com/zczy-k/Con-Nav-Item
- **原项目**: https://github.com/eooce/Con-Nav-Item
- **作者**: zczy-k

### 更新内容
1. 更新所有文档中的仓库链接
2. 创建 Serv00 一键安装脚本 (`scripts/install-serv00.sh`)
3. 更新 package.json 中的作者和仓库信息
4. 更新 README.md 和 DEPLOY_SERV00.md 文档

---

## 修改日期
2025-10-30

## 修改内容

### 1. 创建 Serv00 部署专用文件

#### `app.serv00.js`
- **目的**：为 Serv00 部署创建正确的应用入口文件
- **与 app.js 的区别**：
  - `app.js`: 使用 `web/dist` 目录（本地开发）
  - `app.serv00.js`: 使用 `public` 目录（Serv00 部署）
- **关键配置**：
  - 静态文件目录：`public`
  - 端口：`process.env.PORT || 3000`（由 Passenger 自动设置）
  - **不做任何 Passenger 特殊处理** - 使用标准的 `app.listen()`

### 2. 更新 package.json

#### 修改前：
```json
{
  "engines": {
    "node": ">=14"
  }
}
```

#### 修改后：
```json
{
  "engines": {
    "node": ">=14",
    "npm": ">=6"
  },
  "devEngines": {
    "comment": "For Serv00 deployment, use Node 20",
    "node": "20.x"
  }
}
```

- **原因**：明确标注 Serv00 部署应使用 Node 20
- **说明**：`engines` 保持兼容性，`devEngines` 标注部署建议

### 3. 创建部署文档

#### `DEPLOY_SERV00.md`
完整的 Serv00 部署指南，包括：
- 快速部署命令
- 手动修复步骤
- 常见问题排查
- 验证方法
- 目录结构说明

## 依赖版本说明

### 没有修改依赖包版本的原因

**package.json 中的依赖版本号保持不变**，因为：

1. **版本号本身是正确的**
   - 所有依赖都是稳定版本
   - 使用 `^` 符号允许自动更新补丁版本
   - 与 Node 14-22 都兼容

2. **真正的问题不在版本号**
   - 问题在于**使用哪个 Node 版本来安装**
   - 同样的 `package.json`，用 Node 20 安装和用 Node 22 安装，生成的 `node_modules` 不同
   - 特别是 native 模块（如 `sqlite3`、`bcrypt`）会根据 Node 版本编译不同的二进制文件

3. **正确的安装方式**
   ```bash
   # 在 Serv00 上
   PATH=/usr/local/devil/node20/bin:$PATH npm install
   ```
   这样 npm 会：
   - 使用 Node 20 的环境
   - 编译出适配 Node 20 的 native 模块
   - 生成正确的 `package-lock.json`

## 关键问题回顾

### 最初问题的根本原因
1. **旧文件残留**：安装脚本没有完全清理旧文件
2. **Node 版本不一致**：用 Node 22 安装依赖，但 Passenger 用 Node 20 运行
3. **文件损坏**：`app.js` 可能有语法错误（重复的 `}); }`）

### 解决方案核心
1. **完全覆盖 app.js**：使用正确的、完整的版本
2. **统一 Node 版本**：安装和运行都使用 Node 20
3. **重建站点**：`devil www del` + `devil www add` 清除缓存

## 部署检查清单

部署到 Serv00 时，确保：

- [ ] 使用 `app.serv00.js` 的内容（或确保 `app.js` 使用 `public` 目录）
- [ ] 用 Node 20 安装依赖：`PATH=/usr/local/devil/node20/bin:$PATH npm install`
- [ ] 站点配置使用 `/usr/local/bin/node20`
- [ ] `app.js` 文件完整，最后有 `});`
- [ ] 删除任何 Passenger 特殊处理代码
- [ ] 测试 API：`curl https://域名/api/menus`

## 后续维护

### 更新依赖
如需更新依赖版本：
```bash
# 在 Serv00 上
cd ~/domains/your-domain/public_nodejs
PATH=/usr/local/devil/node20/bin:$PATH npm update
devil www restart your-domain
```

### 添加新依赖
```bash
PATH=/usr/local/devil/node20/bin:$PATH npm install 包名
devil www restart your-domain
```

## 文件清单

本次修改新增的文件：
1. `app.serv00.js` - Serv00 部署版本的应用入口
2. `DEPLOY_SERV00.md` - 详细部署文档
3. `CHANGES.md` - 本文档

修改的文件：
1. `package.json` - 添加了 Node 版本建议

保持不变的文件：
1. `app.js` - 本地开发版本（使用 web/dist）
2. 所有 `routes/*.js` - 路由文件
3. `db.js`, `config.js` - 配置文件
4. 其他所有后端代码

## 注意事项

1. **不要混淆两个 app.js**
   - 本地开发用 `app.js`
   - Serv00 部署要替换成 `app.serv00.js` 的内容

2. **版本号不要随意改**
   - 除非有安全漏洞或重大 bug
   - 改动后必须在 Serv00 上重新测试

3. **提交到 GitHub 时**
   - 保留两个版本的 app.js
   - 在 README 中说明区别
   - 或者使用环境变量来区分路径

## 技术总结

### Passenger 工作原理
- Passenger 会自动设置 `process.env.PORT`
- 不需要特殊的 Passenger 适配代码
- 标准的 `app.listen(PORT)` 就能正常工作
- Passenger 会拦截并接管端口监听

### Node 版本管理
- Serv00 同时提供多个 Node 版本
- 通过 PATH 环境变量选择版本
- 必须保证安装和运行使用同一版本

### Native 模块编译
- SQLite3、bcrypt 等需要编译
- 编译结果与 Node 版本强绑定
- 版本不匹配会导致加载失败或异常
