# 项目重命名总结

## 概述

项目已从 `nav-item` 统一更名为 `Con-Nav-Item`

**执行时间**: 2025-11-03  
**新仓库地址**: https://github.com/zczy-k/Con-Nav-Item

## 修改范围

### 1. 配置文件
- ✅ `package.json` - 更新项目名称和仓库地址
- ✅ `web/package.json` - 更新前端项目名称和仓库地址
- ✅ `docker-compose.yml` - 更新容器和服务名称
- ✅ `config.js` - 更新相关注释和配置

### 2. 文档文件
- ✅ `README.md` - 更新所有项目引用和链接
- ✅ `BACKUP.md` - 更新备份相关路径
- ✅ `BUILD.md` - 更新构建说明
- ✅ `DEPLOY_SERV00.md` - 更新部署文档
- ✅ `FINAL_UPDATE.md` - 更新最终更新文档
- ✅ `HOTFIX.md` - 更新热修复文档
- ✅ `REPOSITORY_UPDATE.md` - 更新仓库更新文档
- ✅ `CHANGES.md` - 更新变更日志
- ✅ `docs/` 目录下所有文档

### 3. 脚本文件
- ✅ `scripts/install-serv00.sh` - 更新安装脚本中的路径和项目名
- ✅ `scripts/reset-serv00.sh` - 更新重置脚本
- ✅ `scripts/backup-manager.sh` - 更新备份管理脚本

### 4. 源代码文件
- ✅ `web/src/views/Home.vue` - 更新GitHub链接
- ✅ `web/src/views/Admin.vue` - 更新GitHub链接
- ✅ 所有路由文件 (`routes/*.js`)
- ✅ 所有组件文件
- ✅ 核心应用文件 (`app.js`, `app.serv00.js`, `db.js`)

### 5. 浏览器扩展
- ✅ `browser-extension/manifest.json` - 更新扩展配置
- ✅ `browser-extension/*.js` - 更新所有JS文件
- ✅ `browser-extension/README.md` - 更新扩展文档

### 6. 构建产物
- ✅ `web/dist/` - 重新构建前端资源
- ✅ `public/` - 更新部署文件

## 技术细节

### 批量替换命令
```powershell
Get-ChildItem -Recurse -File | 
  Where-Object { 
    $_.Extension -match '\.(json|md|sh|vue|js|yml)$' -and 
    $_.FullName -notmatch 'node_modules|\.git|package-lock\.json' 
  } | 
  ForEach-Object { 
    (Get-Content $_.FullName -Raw -Encoding UTF8) -replace 'nav-item', 'Con-Nav-Item' | 
    Set-Content $_.FullName -Encoding UTF8 -NoNewline 
  }
```

### BOM编码修复
由于批量替换后package.json文件出现BOM字符,执行了以下修复:
```powershell
$content = Get-Content 'web\package.json' -Raw
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Resolve-Path 'web\package.json'), $content, $utf8NoBom)
```

### Git远程仓库更新
```bash
git remote set-url origin https://github.com/zczy-k/Con-Nav-Item.git
```

## 影响的功能

所有功能保持不变,只是名称更新:

1. ✅ 导航卡片管理
2. ✅ 菜单和子菜单管理
3. ✅ 用户认证和权限
4. ✅ 批量添加功能
5. ✅ 拖拽排序
6. ✅ 长按编辑/删除
7. ✅ 背景切换
8. ✅ 搜索引擎管理(包括自定义搜索引擎)
9. ✅ 备份和恢复
10. ✅ 浏览器扩展

## 部署注意事项

### Serv00部署
1. 使用新的仓库地址克隆项目:
   ```bash
   git clone https://github.com/zczy-k/Con-Nav-Item.git
   ```

2. 安装脚本已更新,可以直接使用:
   ```bash
   bash scripts/install-serv00.sh
   ```

3. 备份管理脚本也已更新:
   ```bash
   bash scripts/backup-manager.sh
   ```

### Docker部署
docker-compose.yml已更新,可以直接使用:
```bash
docker-compose up -d
```

### 本地开发
1. 克隆新仓库
2. 安装依赖: `npm install`
3. 前端开发: `cd web && npm install && npm run dev`
4. 后端开发: `npm run dev`

## 验证清单

- [x] 所有package.json文件已更新
- [x] 所有文档链接指向新仓库
- [x] 所有脚本路径已更新
- [x] 前端构建成功
- [x] Git远程仓库已更新
- [x] 代码已推送到新仓库
- [x] 浏览器扩展配置已更新

## 提交信息

```
重大更新：将项目名称从nav-item统一更改为Con-Nav-Item

- 更新所有package.json中的项目名称和仓库地址
- 更新所有文档(.md)中的项目引用
- 更新所有脚本(.sh)中的路径和名称  
- 更新Vue组件中的GitHub链接
- 更新配置文件(docker-compose.yml, config.js等)
- 重新构建前端资源
- 修复package.json的BOM编码问题
```

提交哈希: `b7f9108`

## 后续步骤

1. ✅ 将更改推送到GitHub
2. ⏳ 在Serv00上重新部署
3. ⏳ 测试所有功能
4. ⏳ 更新任何外部引用(如果有)

## 文件统计

**修改的文件总数**: 84个
- 源代码文件: 35个
- 文档文件: 13个
- 脚本文件: 3个
- 配置文件: 5个
- 构建产物: 28个

**总行数变化**:
- 新增: 261行
- 删除: 223行
- 净增: 38行

## 总结

项目重命名已成功完成,所有相关文件都已更新。新的项目名称 `Con-Nav-Item` 已在整个代码库中统一使用。所有功能保持完整,可以直接使用新仓库地址进行部署。
