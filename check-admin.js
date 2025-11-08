const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'nav.db');
const db = new sqlite3.Database(dbPath);

console.log('📋 查询管理员信息...\n');

db.get('SELECT id, username, last_login_time FROM users WHERE id = 1', (err, user) => {
  if (err) {
    console.error('❌ 查询失败:', err);
    db.close();
    return;
  }
  
  if (!user) {
    console.error('❌ 用户不存在');
    db.close();
    return;
  }
  
  console.log('✅ 管理员信息:');
  console.log(`   用户ID: ${user.id}`);
  console.log(`   用户名: ${user.username}`);
  console.log(`   最后登录: ${user.last_login_time || '从未登录'}`);
  console.log('\n💡 提示: 登录时请使用上面显示的用户名');
  
  db.close();
});
