# 自动备份策略设计方案

## 方案对比

### 方案一：数据修改后自动备份
**优点**:
- 实时性强，修改立即备份
- 不会遗漏任何修改
- 精确追踪每次修改

**缺点**:
- 频繁备份消耗资源
- 产生大量冗余备份
- 短时间多次修改产生多个备份
- 磁盘空间占用大
- 可能影响用户体验

### 方案二：定时自动备份
**优点**:
- 资源消耗可控
- 备份数量可预测
- 不影响用户操作
- 磁盘空间可控
- 可在低峰期执行

**缺点**:
- 可能丢失两次备份间的修改
- 实时性较差
- 定时点前故障会丢数据

---

## 推荐方案：智能混合策略

### 三层备份策略

```
┌─────────────────────────────────────────┐
│ 第1层：防抖动增量备份 (智能触发)        │
│ - 数据修改后等待5分钟                   │
│ - 5分钟内再次修改重置计时器             │
│ - 5分钟后无修改才执行备份               │
│ - 保留最近10个增量备份                  │
│ - 标记: incremental-YYYYMMDD-HHMMSS.zip │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 第2层：每日完整备份 (凌晨2点)          │
│ - 每天自动创建完整备份                  │
│ - 保留最近7天                           │
│ - 标记: daily-YYYYMMDD.zip              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 第3层：每周完整备份 (周日凌晨3点)      │
│ - 每周创建长期保存备份                  │
│ - 保留最近4周                           │
│ - 标记: weekly-YYYYMMDD.zip             │
└─────────────────────────────────────────┘
```

### 实现细节

#### 1. 防抖动增量备份

```javascript
// utils/autoBackup.js
let backupTimer = null;
let lastBackupTime = 0;
const DEBOUNCE_TIME = 5 * 60 * 1000; // 5分钟
const MIN_BACKUP_INTERVAL = 3 * 60 * 1000; // 最小备份间隔3分钟

function triggerAutoBackup() {
  const now = Date.now();
  
  // 如果距离上次备份不足3分钟，跳过
  if (now - lastBackupTime < MIN_BACKUP_INTERVAL) {
    return;
  }
  
  // 清除之前的定时器
  if (backupTimer) {
    clearTimeout(backupTimer);
  }
  
  // 设置新的定时器
  backupTimer = setTimeout(async () => {
    await createIncrementalBackup();
    lastBackupTime = Date.now();
    await cleanOldBackups('incremental', 10); // 保留10个
  }, DEBOUNCE_TIME);
}

// 在所有数据修改的API中调用
router.post('/api/cards/create', authMiddleware, async (req, res) => {
  // ... 创建卡片逻辑
  triggerAutoBackup(); // 触发自动备份
  res.json({ success: true });
});
```

#### 2. 定时完整备份

```javascript
// utils/scheduledBackup.js
const schedule = require('node-schedule');

// 每天凌晨2点执行
const dailyBackup = schedule.scheduleJob('0 2 * * *', async () => {
  console.log('执行每日备份...');
  await createBackup('daily');
  await cleanOldBackups('daily', 7); // 保留7天
});

// 每周日凌晨3点执行
const weeklyBackup = schedule.scheduleJob('0 3 * * 0', async () => {
  console.log('执行每周备份...');
  await createBackup('weekly');
  await cleanOldBackups('weekly', 4); // 保留4周
});
```

#### 3. 自动清理过期备份

```javascript
async function cleanOldBackups(type, keepCount) {
  const backupDir = path.join(__dirname, '..', 'backups');
  const files = fs.readdirSync(backupDir)
    .filter(file => file.startsWith(type) && file.endsWith('.zip'))
    .map(file => ({
      name: file,
      time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  // 删除超出保留数量的备份
  for (let i = keepCount; i < files.length; i++) {
    const filePath = path.join(backupDir, files[i].name);
    fs.unlinkSync(filePath);
    console.log(`已删除过期备份: ${files[i].name}`);
  }
}
```

### 备份文件命名规则

```
backups/
├── incremental-20251108-143022.zip  # 增量备份
├── incremental-20251108-150134.zip
├── daily-20251108.zip               # 每日备份
├── daily-20251107.zip
├── daily-20251106.zip
├── weekly-20251103.zip              # 每周备份
└── weekly-20251027.zip
```

### 配置选项

```javascript
// config/backup.js
module.exports = {
  incremental: {
    enabled: true,
    debounceTime: 5 * 60 * 1000,      // 防抖时间：5分钟
    minInterval: 3 * 60 * 1000,        // 最小间隔：3分钟
    keep: 10                            // 保留数量：10个
  },
  daily: {
    enabled: true,
    schedule: '0 2 * * *',              // 每天凌晨2点
    keep: 7                             // 保留天数：7天
  },
  weekly: {
    enabled: true,
    schedule: '0 3 * * 0',              // 每周日凌晨3点
    keep: 4                             // 保留周数：4周
  },
  autoClean: true,                      // 自动清理过期备份
  webdavSync: false                     // 是否同步到WebDAV
};
```

### 磁盘空间估算

假设每个备份5MB：
```
增量备份: 10个 × 5MB = 50MB
每日备份: 7个 × 5MB = 35MB
每周备份: 4个 × 5MB = 20MB
─────────────────────────
总计: 约 105MB
```

### 优势总结

✅ **安全性**: 三层备份，多重保障
✅ **实时性**: 修改后5分钟内自动备份
✅ **资源友好**: 防抖机制避免频繁备份
✅ **空间可控**: 自动清理，磁盘占用小
✅ **用户无感**: 后台执行，不影响操作
✅ **灵活恢复**: 可选择不同时间点的备份
✅ **可配置**: 所有参数可调整

### 用户界面展示

```
备份管理页面:
┌─────────────────────────────────────┐
│ 自动备份状态                        │
│ ● 增量备份: 已启用 (最近备份: 5分钟前) │
│ ● 每日备份: 已启用 (下次: 今晚2:00)    │
│ ● 每周备份: 已启用 (下次: 周日3:00)    │
│                                     │
│ [配置自动备份] [立即备份] [查看日志] │
└─────────────────────────────────────┘
```

### 实施优先级

1. **第一阶段**: 实现防抖动增量备份（最重要）
2. **第二阶段**: 添加每日定时备份
3. **第三阶段**: 添加每周备份和自动清理
4. **第四阶段**: 添加WebDAV自动同步

### 监控和日志

```javascript
// 备份日志
{
  timestamp: '2025-11-08T14:30:22Z',
  type: 'incremental',
  trigger: 'data_modified',
  size: '4.8MB',
  status: 'success',
  duration: '1.2s'
}
```

## 总结

**推荐使用混合策略**，既保证了数据安全性，又控制了资源消耗。通过防抖机制避免频繁备份，定时备份作为补充保障，自动清理控制空间占用。这是一个平衡实时性、资源消耗和用户体验的最优方案。
