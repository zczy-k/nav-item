const express = require('express');
const db = require('../db');
const auth = require('./authMiddleware');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { getCommonIcon, extractDomain } = require('../config/commonIcons');
const router = express.Router();

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

// 生成图标文件名
function getIconFileName(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const ext = url.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i)?.[1] || 'png';
  return `${hash}.${ext.toLowerCase()}`;
}

// 异步缓存图标（不阻塞主流程）
async function cacheIconAsync(iconUrl) {
  if (!iconUrl || iconUrl.startsWith('/')) return; // 跳过相对路径
  
  try {
    await ensureCacheDir();
    const fileName = getIconFileName(iconUrl);
    const filePath = path.join(ICON_CACHE_DIR, fileName);
    
    // 检查是否已缓存
    try {
      await fs.access(filePath);
      // 已存在，更新修改时间（touch）以防止被清理
      const now = new Date();
      await fs.utimes(filePath, now, now);
      return;
    } catch {}
    
    // 下载图标
    const response = await axios.get(iconUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // 保存到本地
    await fs.writeFile(filePath, response.data);
    console.log(`缓存图标: ${iconUrl} -> ${fileName}`);
  } catch (error) {
    // 静默失败，不影响主流程
    console.error(`缓存图标失败: ${iconUrl}`, error.message);
  }
}

// 删除旧图标缓存
async function deleteOldIconCache(oldIconUrl) {
  if (!oldIconUrl || oldIconUrl.startsWith('/')) return;
  
  try {
    const fileName = getIconFileName(oldIconUrl);
    const filePath = path.join(ICON_CACHE_DIR, fileName);
    await fs.unlink(filePath);
    console.log(`删除旧图标缓存: ${oldIconUrl}`);
  } catch (error) {
    // 忽略错误（文件可能不存在）
  }
}

// 获取缓存后的图标URL（异步检查文件是否存在）
// 降级策略：常用本地图标 → 服务器缓存 → CDN代理 → 原始URL
async function getCachedIconUrl(iconUrl, cardUrl) {
  if (!iconUrl || iconUrl.startsWith('/')) return iconUrl;
  
  // 1. 优先检查是否有常用网站的本地图标
  const commonIcon = getCommonIcon(cardUrl || iconUrl);
  if (commonIcon) {
    return commonIcon;
  }
  
  // 2. 检查服务器缓存
  const fileName = getIconFileName(iconUrl);
  const filePath = path.join(ICON_CACHE_DIR, fileName);
  
  try {
    await fs.access(filePath);
    // 缓存存在，返回缓存路径
    return `/icons/cache/${fileName}`;
  } catch {
    // 3. 缓存不存在，触发异步下载
    cacheIconAsync(iconUrl).catch(e => console.error('触发图标缓存失败:', e.message));
    
    // 4. 使用 CDN 代理作为备用方案
    const domain = extractDomain(cardUrl || iconUrl);
    if (domain) {
      return `https://icon.horse/icon/${domain}`;
    }
    
    // 5. 最后返回原始URL
    return iconUrl;
  }
}

// 获取指定菜单的卡片
router.get('/:menuId', (req, res) => {
  const { subMenuId } = req.query;
  let query, params;
  
  if (subMenuId) {
    // 获取指定子菜单的卡片
    query = 'SELECT * FROM cards WHERE sub_menu_id = ? ORDER BY "order"';
    params = [subMenuId];
  } else {
    // 获取主菜单的卡片（不包含子菜单的卡片）
    query = 'SELECT * FROM cards WHERE menu_id = ? AND sub_menu_id IS NULL ORDER BY "order"';
    params = [req.params.menuId];
  }
  
  db.all(query, params, async (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    
    // 异步处理每个卡片的图标
    await Promise.all(rows.map(async (card) => {
      if (!card.custom_logo_path) {
        // 检查缓存，不存在则使用原始URL
        if (card.logo_url) {
          card.display_logo = await getCachedIconUrl(card.logo_url, card.url);
        } else {
          card.display_logo = card.url.replace(/\/+$/, '') + '/favicon.ico';
        }
      } else {
        card.display_logo = '/uploads/' + card.custom_logo_path;
      }
    }));
    
    res.json(rows);
  });
});

// 批量更新卡片（用于拖拽排序和分类）- 必须放在/:id之前
router.patch('/batch-update', auth, (req, res) => {
  const { cards } = req.body;
  
  if (!Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ error: '无效的请求数据' });
  }
  
  // 使用Promise优化批量更新
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      let completed = 0;
      let hasError = false;
      
      if (cards.length === 0) {
        db.run('COMMIT');
        return res.json({ success: true, updated: 0 });
      }
      
      cards.forEach((card) => {
        const { id, order, menu_id, sub_menu_id } = card;
        
        db.run(
          'UPDATE cards SET "order"=?, menu_id=?, sub_menu_id=? WHERE id=?',
          [order, menu_id, sub_menu_id || null, id],
          function(err) {
            if (hasError) return; // 已经处理过错误
            
            if (err) {
              hasError = true;
              db.run('ROLLBACK', () => {
                res.status(500).json({ error: err.message });
              });
              return;
            }
            
            completed++;
            
            if (completed === cards.length) {
              db.run('COMMIT', (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                res.json({ success: true, updated: completed });
              });
            }
          }
        );
      });
    });
  });
});

// 新增、修改、删除卡片需认证
router.post('/', auth, (req, res) => {
  const { menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, order } = req.body;
  db.run('INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
    [menu_id, sub_menu_id || null, title, url, logo_url, custom_logo_path, desc, order || 0], function(err) {
    if (err) return res.status(500).json({error: err.message});
    
    // 异步缓存图标（不阻塞响应）
    if (logo_url) {
      cacheIconAsync(logo_url).catch(e => console.error('缓存图标失败:', e.message));
    }
    
    res.json({ id: this.lastID });
  });
});

router.put('/:id', auth, (req, res) => {
  const { menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, order } = req.body;
  
  // 先查询旧的logo_url
  db.get('SELECT logo_url FROM cards WHERE id=?', [req.params.id], (err, oldCard) => {
    if (err) return res.status(500).json({error: err.message});
    
    db.run('UPDATE cards SET menu_id=?, sub_menu_id=?, title=?, url=?, logo_url=?, custom_logo_path=?, desc=?, "order"=? WHERE id=?', 
      [menu_id, sub_menu_id || null, title, url, logo_url, custom_logo_path, desc, order || 0, req.params.id], function(err) {
      if (err) return res.status(500).json({error: err.message});
      
      // 如果logo_url变化了
      if (logo_url !== oldCard?.logo_url) {
        // 删除旧图标缓存
        if (oldCard?.logo_url) {
          deleteOldIconCache(oldCard.logo_url).catch(e => console.error('删除旧图标失败:', e.message));
        }
        // 缓存新图标
        if (logo_url) {
          cacheIconAsync(logo_url).catch(e => console.error('缓存新图标失败:', e.message));
        }
      }
      
      res.json({ changed: this.changes });
    });
  });
});

router.delete('/:id', auth, (req, res) => {
  db.run('DELETE FROM cards WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
