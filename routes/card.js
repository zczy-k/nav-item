const express = require('express');
const db = require('../db');
const auth = require('./authMiddleware');
const { triggerDebouncedBackup } = require('../utils/autoBackup');
const router = express.Router();

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
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    // 直接返回原始数据，图标处理交给前端
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
                triggerDebouncedBackup(); // 触发自动备份
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
    triggerDebouncedBackup(); // 触发自动备份
    res.json({ id: this.lastID });
  });
});

router.put('/:id', auth, (req, res) => {
  const { menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, order } = req.body;
  db.run('UPDATE cards SET menu_id=?, sub_menu_id=?, title=?, url=?, logo_url=?, custom_logo_path=?, desc=?, "order"=? WHERE id=?', 
    [menu_id, sub_menu_id || null, title, url, logo_url, custom_logo_path, desc, order || 0, req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    triggerDebouncedBackup(); // 触发自动备份
    res.json({ changed: this.changes });
  });
});

router.delete('/:id', auth, (req, res) => {
  db.run('DELETE FROM cards WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    triggerDebouncedBackup(); // 触发自动备份
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
