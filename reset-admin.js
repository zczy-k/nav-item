const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'nav.db');
const db = new sqlite3.Database(dbPath);

// 默认重置为 admin/123456
const newUsername = process.argv[2] || 'admin';
const newPassword = process.argv[3] || '123456';

console.log(`正在重置用户为: ${newUsername}`);

// 检查用户
db.get('SELECT id, username FROM users WHERE id = 1', (err, user) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }
  
  if (!user) {
    console.error('用户不存在');
    db.close();
    return;
  }
  
  console.log(`当前用户名: ${user.username}`);
  
  // 加密密码
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  
  // 更新用户名和密码
  db.run('UPDATE users SET username = ?, password = ? WHERE id = 1', 
    [newUsername, hashedPassword], 
    (err) => {
      if (err) {
        console.error('更新失败:', err);
      } else {
        console.log('✅ 重置成功！');
        console.log(`新用户名: ${newUsername}`);
        console.log(`新密码: ${newPassword}`);
      }
      db.close();
    }
  );
});
