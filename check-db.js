const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'nav.db');
const db = new sqlite3.Database(dbPath);

console.log('===== 数据库检查工具 =====\n');

// 检查菜单
db.all('SELECT * FROM menus ORDER BY "order"', (err, rows) => {
  if (err) {
    console.error('❌ 查询菜单失败:', err);
  } else {
    console.log(`✓ 菜单表: ${rows.length} 条记录`);
    rows.forEach(row => {
      console.log(`  - ID:${row.id} ${row.name} (order:${row.order})`);
    });
  }
  
  // 检查子菜单
  db.all('SELECT * FROM sub_menus ORDER BY parent_id, "order"', (err, rows) => {
    if (err) {
      console.error('❌ 查询子菜单失败:', err);
    } else {
      console.log(`\n✓ 子菜单表: ${rows.length} 条记录`);
      rows.forEach(row => {
        console.log(`  - ID:${row.id} ${row.name} (parent:${row.parent_id}, order:${row.order})`);
      });
    }
    
    // 检查卡片
    db.all('SELECT * FROM cards LIMIT 20', (err, rows) => {
      if (err) {
        console.error('❌ 查询卡片失败:', err);
      } else {
        console.log(`\n✓ 卡片表: ${rows.length} 条记录（显示前20条）`);
        rows.forEach(row => {
          console.log(`  - ID:${row.id} ${row.title} (menu:${row.menu_id}, sub:${row.sub_menu_id})`);
        });
      }
      
      // 检查用户
      db.all('SELECT id, username FROM users', (err, rows) => {
        if (err) {
          console.error('❌ 查询用户失败:', err);
        } else {
          console.log(`\n✓ 用户表: ${rows.length} 条记录`);
          rows.forEach(row => {
            console.log(`  - ID:${row.id} ${row.username}`);
          });
        }
        
        // 检查友链
        db.all('SELECT * FROM friends', (err, rows) => {
          if (err) {
            console.error('❌ 查询友链失败:', err);
          } else {
            console.log(`\n✓ 友情链接表: ${rows.length} 条记录`);
            rows.forEach(row => {
              console.log(`  - ID:${row.id} ${row.title}`);
            });
          }
          
          console.log('\n===== 检查完成 =====');
          db.close();
        });
      });
    });
  });
});
