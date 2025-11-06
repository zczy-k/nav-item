const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// 图标缓存目录
const ICON_CACHE_DIR = path.join(__dirname, '../public/icons/cache');

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
  return `${hash}.png`;
}

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
    const response = await axios.get(iconUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // 保存到本地
    await fs.writeFile(filePath, response.data);
    
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
