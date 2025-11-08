# 前端构建流程说明

## 问题

之前每次修改前端代码后，需要手动执行以下步骤：
1. 在 `web` 目录运行 `npm run build` 构建前端
2. 手动复制 `web/dist` 的内容到根目录的 `public` 文件夹
3. 容易遗忘第2步，导致部署时使用的是旧版前端

## 解决方案

已添加自动化构建脚本，**构建后自动复制到 `public` 目录**。

## 使用方法

### 方法一：在项目根目录（推荐）

```bash
npm run build
```

这个命令会：
1. 进入 `web` 目录
2. 运行 `npm run build:prod`（构建 + 自动复制）
3. 返回根目录

### 方法二：在 web 目录

```bash
cd web
npm run build:prod
```

这个命令会：
1. 运行 `vite build` 构建前端到 `web/dist`
2. 自动运行 `copy-to-public.js` 脚本
3. 将 `web/dist` 的所有文件复制到 `../public`

### 开发模式（不需要复制）

如果只是本地开发测试，使用：

```bash
cd web
npm run dev
```

这会启动开发服务器，不会进行构建和复制。

## 文件说明

- `web/package.json` - 添加了 `build:prod` 脚本
- `web/copy-to-public.js` - 自动复制脚本
- `package.json` - 根目录添加了 `build` 快捷脚本

## 工作流程

```
修改前端代码
    ↓
npm run build (在根目录)
    ↓
自动构建 + 自动复制
    ↓
git add .
git commit -m "..."
git push
    ↓
部署到服务器
```

## 注意事项

1. **每次修改前端代码后，记得运行 `npm run build`**
2. 构建完成后，`public` 目录会自动更新
3. 提交代码时确保 `public` 目录的更改也被提交
4. 服务器部署时会直接使用 `public` 目录的文件

## 总结

✅ **无需手动复制**：运行 `npm run build` 即可完成构建和复制  
✅ **减少出错**：自动化流程避免遗忘  
✅ **简化工作**：一条命令搞定所有事情
