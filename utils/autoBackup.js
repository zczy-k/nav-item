const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const schedule = require('node-schedule');

// 配置
const config = {
  debounce: {
    enabled: true,
    delay: 30 * 60 * 1000,        // 30分钟防抖延迟
    maxPerDay: 3,                  // 每天最多触发3次
    keep: 5                        // 保留5个增量备份
  },
  scheduled: {
    enabled: true,
    cron: '0 2 * * *',             // 每天凌晨2点
    keep: 7                        // 保留7天
  },
  autoClean: true                  // 自动清理过期备份
};

// 状态管理
let debounceTimer = null;
let lastBackupTime = 0;
let dailyBackupCount = 0;
let lastBackupDate = new Date().toDateString();

/**
 * 创建备份文件
 */
async function createBackupFile(prefix = 'auto') {
  return new Promise((resolve, reject) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupName = `${prefix}-${timestamp}`;
      const backupDir = path.join(__dirname, '..', 'backups');
      
      // 确保备份目录存在
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupPath = path.join(backupDir, `${backupName}.zip`);
      const output = fs.createWriteStream(backupPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => {
        const stats = fs.statSync(backupPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`[自动备份] 创建成功: ${backupName}.zip (${sizeInMB}MB)`);
        resolve({
          name: `${backupName}.zip`,
          path: backupPath,
          size: sizeInMB
        });
      });
      
      archive.on('error', (err) => {
        console.error('[自动备份] 创建失败:', err);
        reject(err);
      });
      
      archive.pipe(output);
      
      // 备份数据库
      const databaseDir = path.join(__dirname, '..', 'database');
      if (fs.existsSync(databaseDir)) {
        archive.directory(databaseDir, 'database');
      }
      
      // 备份上传文件
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        archive.directory(uploadsDir, 'uploads');
      }
      
      // 备份环境配置
      const envFile = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envFile)) {
        archive.file(envFile, { name: '.env' });
      }
      
      // 创建备份信息文件
      const backupInfo = {
        timestamp: new Date().toISOString(),
        type: prefix,
        version: require('../package.json').version || '1.0.0',
        description: '自动备份'
      };
      archive.append(JSON.stringify(backupInfo, null, 2), { name: 'backup-info.json' });
      
      archive.finalize();
    } catch (error) {
      console.error('[自动备份] 创建失败:', error);
      reject(error);
    }
  });
}

/**
 * 清理过期备份
 */
function cleanOldBackups(prefix, keepCount) {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) return;
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith(prefix) && file.endsWith('.zip'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    // 删除超出保留数量的备份
    let deletedCount = 0;
    for (let i = keepCount; i < files.length; i++) {
      fs.unlinkSync(files[i].path);
      console.log(`[自动备份] 已删除过期备份: ${files[i].name}`);
      deletedCount++;
    }
    
    if (deletedCount > 0) {
      console.log(`[自动备份] 清理完成，删除 ${deletedCount} 个过期备份`);
    }
  } catch (error) {
    console.error('[自动备份] 清理失败:', error);
  }
}

/**
 * 防抖备份 - 数据修改后触发
 */
function triggerDebouncedBackup() {
  if (!config.debounce.enabled) {
    return;
  }
  
  const now = Date.now();
  const currentDate = new Date().toDateString();
  
  // 重置每日计数器
  if (currentDate !== lastBackupDate) {
    dailyBackupCount = 0;
    lastBackupDate = currentDate;
  }
  
  // 检查每日限制
  if (dailyBackupCount >= config.debounce.maxPerDay) {
    console.log('[自动备份] 今日防抖备份次数已达上限');
    return;
  }
  
  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  console.log(`[自动备份] 数据修改，将在 ${config.debounce.delay / 60000} 分钟后自动备份`);
  
  // 设置新的定时器
  debounceTimer = setTimeout(async () => {
    try {
      console.log('[自动备份] 开始执行防抖备份...');
      await createBackupFile('incremental');
      lastBackupTime = Date.now();
      dailyBackupCount++;
      
      // 自动清理
      if (config.autoClean) {
        cleanOldBackups('incremental', config.debounce.keep);
      }
      
      console.log(`[自动备份] 防抖备份完成 (今日第 ${dailyBackupCount}/${config.debounce.maxPerDay} 次)`);
    } catch (error) {
      console.error('[自动备份] 防抖备份失败:', error);
    }
  }, config.debounce.delay);
}

/**
 * 定时备份 - 每天固定时间执行
 */
function startScheduledBackup() {
  if (!config.scheduled.enabled) {
    console.log('[自动备份] 定时备份已禁用');
    return;
  }
  
  console.log(`[自动备份] 定时备份已启动，计划: ${config.scheduled.cron}`);
  
  const job = schedule.scheduleJob(config.scheduled.cron, async () => {
    try {
      console.log('[自动备份] 开始执行定时备份...');
      const result = await createBackupFile('daily');
      
      // 自动清理
      if (config.autoClean) {
        cleanOldBackups('daily', config.scheduled.keep);
      }
      
      console.log(`[自动备份] 定时备份完成: ${result.name}`);
    } catch (error) {
      console.error('[自动备份] 定时备份失败:', error);
    }
  });
  
  // 计算下次执行时间
  const nextRun = job.nextInvocation();
  if (nextRun) {
    console.log(`[自动备份] 下次定时备份: ${nextRun.toLocaleString('zh-CN')}`);
  }
  
  return job;
}

/**
 * 获取备份统计信息
 */
function getBackupStats() {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      return {
        incremental: { count: 0, size: 0 },
        daily: { count: 0, size: 0 },
        total: { count: 0, size: 0 }
      };
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.zip'))
      .map(file => {
        const stats = fs.statSync(path.join(backupDir, file));
        return {
          name: file,
          size: stats.size,
          type: file.startsWith('incremental') ? 'incremental' : 
                file.startsWith('daily') ? 'daily' : 'manual'
        };
      });
    
    const incremental = files.filter(f => f.type === 'incremental');
    const daily = files.filter(f => f.type === 'daily');
    
    return {
      incremental: {
        count: incremental.length,
        size: (incremental.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)).toFixed(2)
      },
      daily: {
        count: daily.length,
        size: (daily.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)).toFixed(2)
      },
      total: {
        count: files.length,
        size: (files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)).toFixed(2)
      },
      dailyBackupCount,
      maxPerDay: config.debounce.maxPerDay
    };
  } catch (error) {
    console.error('[自动备份] 获取统计信息失败:', error);
    return null;
  }
}

module.exports = {
  triggerDebouncedBackup,
  startScheduledBackup,
  getBackupStats,
  config
};
