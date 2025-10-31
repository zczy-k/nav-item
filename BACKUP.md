# Nav-Item 备份与恢复指南

## 🚀 快速开始

使用统一的备份管理工具，通过交互式菜单完成所有备份和恢复操作。

### 使用方法

**启动备份管理工具：**

```bash
# 默认域名
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/backup-manager.sh)

# 自定义域名
DOMAIN=your-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/backup-manager.sh)
```

---

## 📋 功能菜单

启动后会显示交互式菜单：

```
==========================================
  Nav-Item 备份管理工具
  GitHub: github.com/zczy-k/nav-item
==========================================

当前域名: your-domain.com

请选择操作：

  1) 📦 创建本地备份
  2) 💙 备份到 GitHub
  3) 🔄 恢复本地备份
  4) 🔄 从 GitHub 恢复
  5) 📋 查看备份列表
  6) ⚙️  GitHub 配置
  0) 🚪 退出
```

---

## 📦 本地备份

### 特点
- ✅ 快速，存储在服务器本地
- ✅ `.tar.gz` 压缩格式
- ✅ 保存在 `~/nav-item-backups/`

### 使用
1. 选择菜单选项 `1`
2. 自动备份数据库、上传文件、配置
3. 完成后显示备份文件路径和大小

### 下载到本地
```bash
scp username@hostname:~/nav-item-backups/nav-item-backup-*.tar.gz .
```

---

## 💙 GitHub 云端备份

### 特点
- ✅ 云端存储，不占服务器空间
- ✅ Git 版本管理，保留历史
- ✅ 从任何设备恢复
- ✅ 免费（私有仓库）

### 首次配置

1. **创建 GitHub 私有仓库**
   - 访问 https://github.com/new
   - 名称：`nav-item-backup`
   - 类型：**Private**（私有）

2. **创建 Personal Access Token**
   - 访问 https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 权限：勾选 `repo`
   - 复制生成的 token

3. **在菜单中配置**
   - 选择选项 `6` (GitHub 配置)
   - 输入 Token
   - 输入仓库名（格式：`username/nav-item-backup`）

### 备份到 GitHub
- 选择菜单选项 `2`
- 自动推送到 GitHub 仓库

### 定时自动备份
```bash
# 编辑 crontab
crontab -e

# 每6小时自动备份
0 */6 * * * DOMAIN=your-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/backup-manager.sh) <<< "2" > /dev/null 2>&1
```

### 安全说明
⚠️ **重要：**
- 必须使用私有仓库
- Token 安全存储（`~/.nav-item-github-config`）
- 备份包含敏感信息（密码、数据库）

---

## 🔄 恢复备份

### 恢复本地备份
1. 选择菜单选项 `3`
2. 从列表中选择要恢复的备份
3. 确认恢复（输入 `yes`）
4. 自动恢复并重启应用

### 从 GitHub 恢复
```bash
# 克隆备份仓库
git clone https://github.com/your-username/nav-item-backup.git

# 选择要恢复的备份
cd nav-item-backup/backups/20250131_030000

# 恢复到项目目录
cp -r database ~/domains/your-domain.com/public_nodejs/
cp -r uploads ~/domains/your-domain.com/public_nodejs/
cp .env ~/domains/your-domain.com/public_nodejs/

# 重启应用
devil www restart your-domain.com
```

---

## 🚀 迁移场景

### 场景1：更换服务器

**旧服务器：**
```bash
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/backup-manager.sh)
# 选择: 2 (备份到 GitHub)
```

**新服务器：**
```bash
# 安装应用
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/install-serv00.sh)

# 从 GitHub 恢复备份
git clone https://github.com/your-username/nav-item-backup.git
cd nav-item-backup/backups/latest
cp -r * ~/domains/your-domain.com/public_nodejs/
```

### 场景2：更换域名

```bash
# 1. 备份旧域名
DOMAIN=old-domain.com bash <(curl -Ls .../backup-manager.sh)
# 选择: 1 (本地备份)

# 2. 安装新域名
DOMAIN=new-domain.com bash <(curl -Ls .../install-serv00.sh)

# 3. 恢复到新域名
DOMAIN=new-domain.com bash <(curl -Ls .../backup-manager.sh)
# 选择: 3 (恢复本地备份)
```

---

## 📝 备份内容

每次备份包含：
- ✅ **database/** - 数据库文件（所有菜单、卡片、用户数据）
- ✅ **uploads/** - 上传的图片文件（Logo等）
- ✅ **.env** - 环境配置（管理员密码等）
- ✅ **backup-info.txt** - 备份信息（时间、服务器等）

---

## ❓ 常见问题

### Q: 备份文件保存在哪里？
**A:** 
- 本地：`~/nav-item-backups/`
- GitHub：你配置的私有仓库

### Q: 备份文件有多大？
**A:** 通常 1-10 MB，取决于数据量和上传文件大小。

### Q: GitHub 备份安全吗？
**A:** 安全，但务必使用私有仓库，并保护好 Token。

### Q: 可以自动备份吗？
**A:** 可以，使用 crontab 设置定时任务。

### Q: 恢复备份会影响运行吗？
**A:** 恢复过程会短暂重启应用（约1-2秒）。

### Q: 如何查看所有备份？
**A:** 在菜单中选择选项 `5`（查看备份列表）。

---

## 🆘 故障排除

### 问题：提示"未找到项目目录"
**解决：**
```bash
# 检查域名是否正确
ls ~/domains/

# 使用正确的域名
DOMAIN=correct-domain.com bash <(curl -Ls .../backup-manager.sh)
```

### 问题：GitHub 推送失败
**解决：**
1. 检查 Token 权限是否包含 `repo`
2. 检查仓库名称是否正确
3. 确认仓库已创建且为私有
4. 检查网络连接

### 问题：未找到备份文件
**解决：**
```bash
# 查看备份目录
ls -la ~/nav-item-backups/

# 如果在其他位置，先移动
mv /path/to/backup.tar.gz ~/nav-item-backups/
```

---

## 📊 备份最佳实践

1. ✅ **定期备份** - 建议每天或每周备份
2. ✅ **多地备份** - 同时使用本地和 GitHub 备份
3. ✅ **测试恢复** - 定期测试备份恢复流程
4. ✅ **版本管理** - 保留多个历史版本
5. ✅ **安全存储** - 使用私有仓库，保护 Token

---

## 📞 获取帮助

- GitHub Issues: https://github.com/zczy-k/nav-item/issues
- 项目文档: https://github.com/zczy-k/nav-item
