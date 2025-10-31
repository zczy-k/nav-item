# Nav-Item 备份与恢复指南

## 📦 备份功能

一键备份脚本可以自动备份导航站的所有重要数据，方便迁移和灾难恢复。

### 备份内容

- ✅ **数据库** (`database/`) - 所有菜单、卡片、用户数据
- ✅ **上传文件** (`uploads/`) - Logo 和其他上传的图片
- ✅ **环境配置** (`.env`) - 管理员密码等配置

### 使用方法

#### 1. 一键备份

**使用默认域名：**
```bash
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/backup-serv00.sh)
```

**使用自定义域名：**
```bash
DOMAIN=your-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/backup-serv00.sh)
```

#### 2. 备份说明

- 备份文件自动保存到 `~/nav-item-backups/` 目录
- 文件名格式：`nav-item-backup-YYYYMMDD_HHMMSS.tar.gz`
- 压缩格式：`.tar.gz`（gzip 压缩，节省空间）

#### 3. 查看所有备份

```bash
ls -lh ~/nav-item-backups/
```

#### 4. 下载备份到本地

```bash
# 替换 username、hostname 和 backup-file
scp username@hostname:~/nav-item-backups/nav-item-backup-YYYYMMDD_HHMMSS.tar.gz .
```

---

## 🔄 恢复功能

从备份恢复导航站数据，支持选择历史备份。

### 使用方法

#### 1. 一键恢复

**使用默认域名：**
```bash
bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/restore-serv00.sh)
```

**使用自定义域名：**
```bash
DOMAIN=your-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/restore-serv00.sh)
```

#### 2. 恢复流程

1. 脚本自动列出所有可用备份
2. 选择要恢复的备份编号
3. 确认恢复操作（输入 `yes`）
4. 自动恢复数据并重启应用

#### 3. 注意事项

⚠️ **警告：恢复操作会覆盖当前数据！**

- 恢复前建议先创建当前数据的备份
- 确保选择正确的备份文件
- 恢复后会自动重启应用

---

## 💾 手动备份（高级）

如果需要手动操作：

### 1. 手动创建备份

```bash
# 进入项目目录
cd ~/domains/your-domain.com/public_nodejs

# 创建备份
tar -czf ~/nav-item-backup-manual.tar.gz database/ uploads/ .env

# 查看备份大小
ls -lh ~/nav-item-backup-manual.tar.gz
```

### 2. 手动恢复备份

```bash
# 解压备份
tar -xzf ~/nav-item-backup-manual.tar.gz -C ~/temp/

# 恢复文件
cd ~/domains/your-domain.com/public_nodejs
rm -rf database/ uploads/
cp -r ~/temp/database ./
cp -r ~/temp/uploads ./
cp ~/temp/.env ./

# 重启应用
devil www restart your-domain.com

# 清理临时文件
rm -rf ~/temp/
```

---

## 🚀 迁移场景

### 场景1：同一服务器换域名

1. 备份旧域名数据：
   ```bash
   DOMAIN=old-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/backup-serv00.sh)
   ```

2. 安装新域名：
   ```bash
   DOMAIN=new-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/install-serv00.sh)
   ```

3. 恢复备份到新域名：
   ```bash
   DOMAIN=new-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/restore-serv00.sh)
   ```

### 场景2：迁移到新服务器

1. 在旧服务器创建备份：
   ```bash
   bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/backup-serv00.sh)
   ```

2. 下载备份到本地：
   ```bash
   scp username@old-server:~/nav-item-backups/nav-item-backup-*.tar.gz .
   ```

3. 上传备份到新服务器：
   ```bash
   scp nav-item-backup-*.tar.gz username@new-server:~/nav-item-backups/
   ```

4. 在新服务器安装应用：
   ```bash
   bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/install-serv00.sh)
   ```

5. 恢复备份：
   ```bash
   bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/restore-serv00.sh)
   ```

### 场景3：定期自动备份

创建定时任务（cron）：

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨 3 点备份）
0 3 * * * bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/backup-serv00.sh) > /dev/null 2>&1

# 或使用自定义域名
0 3 * * * DOMAIN=your-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/backup-serv00.sh) > /dev/null 2>&1
```

### 场景4：清理旧备份

保留最近 7 天的备份，删除旧备份：

```bash
# 查看备份目录大小
du -sh ~/nav-item-backups/

# 删除 7 天前的备份
find ~/nav-item-backups/ -name "nav-item-backup-*.tar.gz" -mtime +7 -delete

# 或保留最近 5 个备份
cd ~/nav-item-backups/
ls -t nav-item-backup-*.tar.gz | tail -n +6 | xargs rm -f
```

---

## ❓ 常见问题

### Q: 备份文件保存在哪里？
A: `~/nav-item-backups/` 目录下。

### Q: 备份文件有多大？
A: 通常 1-10 MB，取决于你的数据量和上传文件大小。

### Q: 可以在 Windows 上恢复备份吗？
A: 可以，解压 `.tar.gz` 文件后手动复制到项目目录。

### Q: 恢复备份会影响正在运行的应用吗？
A: 恢复过程会短暂重启应用（约 1-2 秒），期间可能无法访问。

### Q: 备份是否包含管理员密码？
A: 是的，`.env` 文件中包含管理员密码配置。

### Q: 如何验证备份是否成功？
A: 备份完成后，脚本会显示备份文件路径和大小。你可以解压查看内容：
```bash
tar -tzf ~/nav-item-backups/nav-item-backup-*.tar.gz
```

---

## 📝 备份最佳实践

1. ✅ **定期备份** - 建议每天自动备份
2. ✅ **多地备份** - 同时保存到本地和云端
3. ✅ **测试恢复** - 定期测试备份恢复流程
4. ✅ **版本管理** - 保留多个历史版本
5. ✅ **安全存储** - 备份文件包含敏感信息，注意权限

---

## 🆘 故障排除

### 备份失败

**问题：** 提示"未找到项目目录"

**解决：**
```bash
# 检查域名是否正确
ls ~/domains/

# 使用正确的域名
DOMAIN=correct-domain.com bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/backup-serv00.sh)
```

### 恢复失败

**问题：** 提示"未找到备份文件"

**解决：**
```bash
# 检查备份目录
ls -la ~/nav-item-backups/

# 如果备份在其他位置，先移动
mv /path/to/backup.tar.gz ~/nav-item-backups/
```

---

## 📞 获取帮助

- GitHub Issues: https://github.com/zczy-k/nav-item/issues
- 项目文档: https://github.com/zczy-k/nav-item
