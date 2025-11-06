const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// 图标缓存目录
const ICON_CACHE_DIR = path.join(__dirname, '../public/icons/cache');
const CACHE_EXPIRY_DAYS = 15; // 缓存过15天

// 确保缓存目录存在
async function ensureCacheDir() {
  try {
    await fs.access(ICON_CACHE_DIR);
  } catch {
    await fs.mkdir(ICON_CACHE_DIR, { recursive: true });
  }
}

// 生成图标文件名（使用URL的MD5哈希）
function getIconFileName(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  // 根据URL后缀确定文件类型
  const ext = url.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i)?.[1] || 'png';
  return `${hash}.${ext.toLowerCase()}`;
}

// 下载图标
async function downloadIcon(iconUrl) {
  try {
    const response = await axios.get(iconUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`下载图标失败: ${iconUrl}`, error.message);
    throw error;
  }
}

// 清理过期缓存
async function cleanExpiredCache() {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(ICON_CACHE_DIR);
    const now = Date.now();
    const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    let cleaned = 0;
    for (const file of files) {
      const filePath = path.join(ICON_CACHE_DIR, file);
      const stats = await fs.stat(filePath);
      
      // 如果文件超过15天未修改，删除它
      if (now - stats.mtimeMs > expiryMs) {
        await fs.unlink(filePath);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`清理了 ${cleaned} 个过期图标缓存`);
    }
  } catch (error) {
    console.error('清理缓存失败:', error.message);
  }
}

// 每天1小时执行一次清理
setInterval(cleanExpiredCache, 60 * 60 * 1000);
// 启动时立即执行一次
cleanExpiredCache();

// 下载并缓存图标
router.post('/download', async (req, res) => {
  try {
    const { iconUrl } = req.body;
    
    if (!iconUrl) {
      return res.status(400).json({ error: '图标URL不能为空' });
    }

    await ensureCacheDir();
    
    const fileName = getIconFileName(iconUrl);
    const filePath = path.join(ICON_CACHE_DIR, fileName);
    
    // 检查是否已缓存
    try {
      await fs.access(filePath);
      // 已存在，返回缓存路径
      return res.json({ 
        success: true, 
        cachedUrl: `/icons/cache/${fileName}`,
        cached: true
      });
    } catch {
      // 不存在，下载
    }
    
    // 下载图标
    const imageData = await downloadIcon(iconUrl);
    
    // 保存到本地
    await fs.writeFile(filePath, imageData);
    
    res.json({ 
      success: true, 
      cachedUrl: `/icons/cache/${fileName}`,
      cached: false
    });
    
  } catch (error) {
    console.error('图标下载失败:', error.message);
    res.status(500).json({ 
      error: '图标下载失败',
      message: error.message 
    });
  }
});

// 获取缓存的图标
router.get('/:hash', async (req, res) => {
  try {
    const fileName = `${req.params.hash}.png`;
    const filePath = path.join(ICON_CACHE_DIR, fileName);
    
    await fs.access(filePath);
    res.sendFile(filePath);
    
  } catch (error) {
    res.status(404).json({ error: '图标不存在' });
  }
});

module.exports = router;
