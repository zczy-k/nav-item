const express = require('express');
const db = require('../db');
const auth = require('./authMiddleware');
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
    rows.forEach(card => {
      if (!card.custom_logo_path) {
        card.display_logo = card.logo_url || (card.url.replace(/\/+$/, '') + '/favicon.ico');
      } else {
        card.display_logo = '/uploads/' + card.custom_logo_path;
      }
    });
    res.json(rows);
  });
});

// 新增、修改、删除卡片需认证
router.post('/', auth, (req, res) => {
  const { menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, order } = req.body;
  db.run('INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
    [menu_id, sub_menu_id || null, title, url, logo_url, custom_logo_path, desc, order || 0], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ id: this.lastID });
  });
});

router.put('/:id', auth, (req, res) => {
  const { menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, order } = req.body;
  db.run('UPDATE cards SET menu_id=?, sub_menu_id=?, title=?, url=?, logo_url=?, custom_logo_path=?, desc=?, "order"=? WHERE id=?', 
    [menu_id, sub_menu_id || null, title, url, logo_url, custom_logo_path, desc, order || 0, req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ changed: this.changes });
  });
});

router.delete('/:id', auth, (req, res) => {
  db.run('DELETE FROM cards WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ deleted: this.changes });
  });
});

// 批量更新卡片（用于拖拽排序和分类）
router.patch('/batch-update', auth, (req, res) => {
  const { cards } = req.body;
  
  if (!Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ error: '无效的请求数据' });
  }
  
  // 使用事务批量更新
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    let completed = 0;
    let hasError = false;
    
    cards.forEach((card, index) => {
      const { id, order, menu_id, sub_menu_id } = card;
      
      db.run(
        'UPDATE cards SET "order"=?, menu_id=?, sub_menu_id=? WHERE id=?',
        [order, menu_id, sub_menu_id || null, id],
        function(err) {
          if (err && !hasError) {
            hasError = true;
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          
          completed++;
          
          if (completed === cards.length && !hasError) {
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

module.exports = router;
