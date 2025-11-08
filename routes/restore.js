const util = require('util');
const exec = util.promisify(require('child_process').exec);

// ... (existing backup routes)

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
