const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const unzipper = require('unzipper');
const authMiddleware = require('./authMiddleware');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// 创建备份
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupName = `backup-${timestamp}`;
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // 确保备份目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupPath = path.join(backupDir, `${backupName}.zip`);
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    output.on('close', () => {
      const stats = fs.statSync(backupPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      res.json({
        success: true,
        message: '备份创建成功',
        backup: {
          name: `${backupName}.zip`,
          path: backupPath,
          size: `${sizeInMB} MB`,
          timestamp: new Date().toISOString()
        }
      });
    });
    
    archive.on('error', (err) => {
      throw err;
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
      version: require('../package.json').version || '1.0.0',
      description: '数据库、上传文件和配置文件备份'
    };
    archive.append(JSON.stringify(backupInfo, null, 2), { name: 'backup-info.json' });
    
    await archive.finalize();
    
  } catch (error) {
    console.error('备份创建失败:', error);
    res.status(500).json({
      success: false,
      message: '备份创建失败',
      error: error.message
    });
  }
});

// 获取备份列表
router.get('/list', authMiddleware, (req, res) => {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      return res.json({
        success: true,
        backups: []
      });
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.zip'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    res.json({
      success: true,
      backups: files
    });
    
  } catch (error) {
    console.error('获取备份列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取备份列表失败',
      error: error.message
    });
  }
});

// 下载备份
router.get('/download/:filename', (req, res, next) => {
  if (req.headers.authorization) {
    return authMiddleware(req, res, next);
  }
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
    return authMiddleware(req, res, next);
  }
  return res.status(401).json({ success: false, message: '未提供Token' });
}, (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '..', 'backups');
    const filePath = path.join(backupDir, filename);
    
    if (!fs.existsSync(filePath) || !filename.endsWith('.zip')) {
      return res.status(404).json({
        success: false,
        message: '备份文件不存在'
      });
    }
    
    res.download(filePath, filename);
    
  } catch (error) {
    console.error('下载备份失败:', error);
    res.status(500).json({
      success: false,
      message: '下载备份失败',
      error: error.message
    });
  }
});

// 删除备份
router.delete('/delete/:filename', authMiddleware, (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '..', 'backups');
    const filePath = path.join(backupDir, filename);
    
    if (!fs.existsSync(filePath) || !filename.endsWith('.zip')) {
      return res.status(404).json({
        success: false,
        message: '备份文件不存在'
      });
    }
    
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: '备份删除成功'
    });
    
  } catch (error) {
    console.error('删除备份失败:', error);
    res.status(500).json({
      success: false,
      message: '删除备份失败',
      error: error.message
    });
  }
});

// 恢复备份
router.post('/restore/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '..', 'backups');
    const filePath = path.join(backupDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: '备份文件不存在' });
    }

    // 1. 解压到临时目录
    const tempDir = path.join(__dirname, '..', `temp-restore-${Date.now()}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    
    const stream = fs.createReadStream(filePath);
    await new Promise((resolve, reject) => {
      stream.pipe(unzipper.Extract({ path: tempDir }))
        .on('finish', resolve)
        .on('error', reject);
    });

    // 2. 覆盖文件 (可添加更安全的逻辑，如先备份当前数据)
    const projectRoot = path.join(__dirname, '..');
    const backupContents = fs.readdirSync(tempDir);

    for (const item of backupContents) {
      const sourcePath = path.join(tempDir, item);
      const destPath = path.join(projectRoot, item);
      await exec(`cp -r "${sourcePath}" "${destPath}"`);
    }

    // 3. 清理临时文件
    fs.rmSync(tempDir, { recursive: true, force: true });

    res.json({ success: true, message: '备份恢复成功！应用可能需要重启以生效。' });

  } catch (error) {
    console.error('恢复备份失败:', error);
    res.status(500).json({ success: false, message: '恢复备份失败', error: error.message });
  }
});

module.exports = router;
