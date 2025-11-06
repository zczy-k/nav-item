const express = require('express');
const db = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// 获取所有菜单（包含子菜单）
router.get('/', (req, res) => {
  const { page, pageSize } = req.query;
  
  // 设置 20 秒超时保护
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error('GET /api/menus 超时');
      res.status(504).json({ error: '请求超时' });
    }
  }, 20000);
  
  if (!page && !pageSize) {
    // 获取主菜单
    db.all('SELECT * FROM menus ORDER BY "order"', [], (err, menus) => {
      if (err) {
        clearTimeout(timeout);
        return res.status(500).json({error: err.message});
      }
      
      if (!menus || menus.length === 0) {
        clearTimeout(timeout);
        return res.json([]);
      }
      
      // 为每个主菜单获取子菜单
      const getSubMenus = (menu) => {
        return new Promise((resolve, reject) => {
          const subTimeout = setTimeout(() => reject(new Error('Submenu query timeout')), 5000);
          
          db.all('SELECT * FROM sub_menus WHERE parent_id = ? ORDER BY "order"', [menu.id], (err, subMenus) => {
            clearTimeout(subTimeout);
            if (err) reject(err);
            else resolve(subMenus || []);
          });
        });
      };
      
      Promise.all(menus.map(async (menu) => {
        try {
          const subMenus = await getSubMenus(menu);
          return { ...menu, subMenus };
        } catch (err) {
          console.error(`获取菜单 ${menu.id} 的子菜单失败:`, err.message);
          return { ...menu, subMenus: [] };
        }
      })).then(menusWithSubMenus => {
        clearTimeout(timeout);
        if (!res.headersSent) {
          res.json(menusWithSubMenus);
        }
      }).catch(err => {
        clearTimeout(timeout);
        if (!res.headersSent) {
          console.error('Promise.all 失败:', err.message);
          res.status(500).json({error: err.message});
        }
      });
    });
  } else {
    const pageNum = parseInt(page) || 1;
    const size = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * size;
    db.get('SELECT COUNT(*) as total FROM menus', [], (err, countRow) => {
      if (err) return res.status(500).json({error: err.message});
      db.all('SELECT * FROM menus ORDER BY "order" LIMIT ? OFFSET ?', [size, offset], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({
          total: countRow.total,
          page: pageNum,
          pageSize: size,
          data: rows
        });
      });
    });
  }
});

// 获取指定菜单的子菜单
router.get('/:id/submenus', (req, res) => {
  db.all('SELECT * FROM sub_menus WHERE parent_id = ? ORDER BY "order"', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

// 新增、修改、删除菜单需认证
router.post('/', auth, (req, res) => {
  const { name, order } = req.body;
  db.run('INSERT INTO menus (name, "order") VALUES (?, ?)', [name, order || 0], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ id: this.lastID });
  });
});

router.put('/:id', auth, (req, res) => {
  const { name, order } = req.body;
  db.run('UPDATE menus SET name=?, "order"=? WHERE id=?', [name, order || 0, req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ changed: this.changes });
  });
});

router.delete('/:id', auth, (req, res) => {
  db.run('DELETE FROM menus WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ deleted: this.changes });
  });
});

// 子菜单相关API
router.post('/:id/submenus', auth, (req, res) => {
  const { name, order } = req.body;
  db.run('INSERT INTO sub_menus (parent_id, name, "order") VALUES (?, ?, ?)', 
    [req.params.id, name, order || 0], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ id: this.lastID });
  });
});

router.put('/submenus/:id', auth, (req, res) => {
  const { name, order } = req.body;
  db.run('UPDATE sub_menus SET name=?, "order"=? WHERE id=?', [name, order || 0, req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ changed: this.changes });
  });
});

router.delete('/submenus/:id', auth, (req, res) => {
  db.run('DELETE FROM sub_menus WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ deleted: this.changes });
  });
});

module.exports = router; 