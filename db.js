const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('./config');

const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const db = new sqlite3.Database(path.join(dbDir, 'nav.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    "order" INTEGER DEFAULT 0
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_menus_order ON menus("order")`);
  
  // 添加子菜单表
  db.run(`CREATE TABLE IF NOT EXISTS sub_menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    FOREIGN KEY(parent_id) REFERENCES menus(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sub_menus_parent_id ON sub_menus(parent_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sub_menus_order ON sub_menus("order")`);
  
  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id INTEGER,
    sub_menu_id INTEGER,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    logo_url TEXT,
    custom_logo_path TEXT,
    desc TEXT,
    "order" INTEGER DEFAULT 0,
    FOREIGN KEY(menu_id) REFERENCES menus(id) ON DELETE CASCADE,
    FOREIGN KEY(sub_menu_id) REFERENCES sub_menus(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cards_menu_id ON cards(menu_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cards_sub_menu_id ON cards(sub_menu_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cards_order ON cards("order")`);
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    last_login_time TEXT,
    last_login_ip TEXT
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  db.run(`CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position TEXT NOT NULL, -- left/right
    img TEXT NOT NULL,
    url TEXT NOT NULL
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(position)`);
  db.run(`CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    logo TEXT
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_friends_title ON friends(title)`);
  
  // 自定义搜索引擎表
  db.run(`CREATE TABLE IF NOT EXISTS custom_search_engines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    search_url TEXT NOT NULL,
    icon_url TEXT,
    keyword TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_custom_search_engines_order ON custom_search_engines("order")`);

  // 检查菜单表是否为空，若为空则插入默认菜单
  db.get('SELECT COUNT(*) as count FROM menus', (err, row) => {
    if (row && row.count === 0) {
      const defaultMenus = [
        ['Home', 1],
        ['Ai Stuff', 2],
        ['Cloud', 3],
        ['Software', 4],
        ['Tools', 5],
        ['Other', 6]
      ];
      const stmt = db.prepare('INSERT INTO menus (name, "order") VALUES (?, ?)');
      defaultMenus.forEach(([name, order]) => stmt.run(name, order));
      stmt.finalize(() => {
        // 确保菜单插入完成后再插入子菜单和卡片
        console.log('菜单插入完成，开始插入默认子菜单和卡片...');
        insertDefaultSubMenusAndCards();
      });
    }
  });

  // 插入默认子菜单和卡片的函数
  function insertDefaultSubMenusAndCards() {
    db.all('SELECT * FROM menus ORDER BY "order"', (err, menus) => {
      if (err) {
        console.error('获取菜单失败:', err);
        return;
      }
      
      if (menus && menus.length) {
        console.log('找到菜单数量:', menus.length);
        menus.forEach(menu => {
          console.log(`菜单: ${menu.name} (ID: ${menu.id})`);
        });
        
        const menuMap = {};
        menus.forEach(m => { menuMap[m.name] = m.id; });
        console.log('菜单映射:', menuMap);
        
        // 插入子菜单
        const subMenus = [
          { parentMenu: 'Ai Stuff', name: 'AI chat', order: 1 },
          { parentMenu: 'Ai Stuff', name: 'AI tools', order: 2 },
          { parentMenu: 'Tools', name: 'Dev Tools', order: 1 },
          { parentMenu: 'Software', name: 'Mac', order: 1 },
          { parentMenu: 'Software', name: 'iOS', order: 2 },
          { parentMenu: 'Software', name: 'Android', order: 3 },
          { parentMenu: 'Software', name: 'Windows', order: 4 }
        ];
        
        const subMenuStmt = db.prepare('INSERT INTO sub_menus (parent_id, name, "order") VALUES (?, ?, ?)');
        let subMenuInsertCount = 0;
        const subMenuMap = {};
        
        subMenus.forEach(subMenu => {
          if (menuMap[subMenu.parentMenu]) {
            subMenuStmt.run(menuMap[subMenu.parentMenu], subMenu.name, subMenu.order, function(err) {
              if (err) {
                console.error(`插入子菜单失败 [${subMenu.parentMenu}] ${subMenu.name}:`, err);
              } else {
                subMenuInsertCount++;
                // 保存子菜单ID映射，用于后续插入卡片
                subMenuMap[`${subMenu.parentMenu}_${subMenu.name}`] = this.lastID;
                console.log(`成功插入子菜单 [${subMenu.parentMenu}] ${subMenu.name} (ID: ${this.lastID})`);
              }
            });
          } else {
            console.warn(`未找到父菜单: ${subMenu.parentMenu}`);
          }
        });
        
        subMenuStmt.finalize(() => {
          console.log(`所有子菜单插入完成，总计: ${subMenuInsertCount} 个子菜单`);
          
          // 插入卡片（包括主菜单卡片和子菜单卡片）
          const cards = [
            // Home
            { menu: 'Home', title: 'Baidu', url: 'https://www.baidu.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.baidu.com&sz=128', desc: '全球最大的中文搜索引擎'  },
            { menu: 'Home', title: 'Youtube', url: 'https://www.youtube.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.youtube.com&sz=128', desc: '全球最大的视频社区'  },
            { menu: 'Home', title: 'Gmail', url: 'https://mail.google.com', logo_url: 'https://api.xinac.net/icon/?url=https://mail.google.com&sz=128', desc: ''  },
            { menu: 'Home', title: 'GitHub', url: 'https://github.com', logo_url: 'https://api.xinac.net/icon/?url=https://github.com&sz=128', desc: '全球最大的代码托管平台'  },
            { menu: 'Home', title: 'ip.sb', url: 'https://ip.sb', logo_url: 'https://api.xinac.net/icon/?url=https://ip.sb&sz=128', desc: 'ip地址查询'  },
            { menu: 'Home', title: 'Cloudflare', url: 'https://dash.cloudflare.com', logo_url: 'https://api.xinac.net/icon/?url=https://dash.cloudflare.com&sz=128', desc: '全球最大的cdn服务商'  },
            { menu: 'Home', title: 'ChatGPT', url: 'https://chat.openai.com', logo_url: 'https://api.xinac.net/icon/?url=https://chat.openai.com&sz=128', desc: '人工智能AI聊天机器人'  },
            { menu: 'Home', title: 'Huggingface', url: 'https://huggingface.co', logo_url: 'https://api.xinac.net/icon/?url=https://huggingface.co&sz=128', desc: '全球最大的开源模型托管平台'  },
            { menu: 'Home', title: 'ITDOG - 在线ping', url: 'https://www.itdog.cn/tcping', logo_url: 'https://api.xinac.net/icon/?url=https://www.itdog.cn&sz=128', desc: '在线tcping'  },
            { menu: 'Home', title: 'Ping0', url: 'https://ping0.cc', logo_url: 'https://api.xinac.net/icon/?url=https://ping0.cc&sz=128', desc: 'ip地址查询'  },
            { menu: 'Home', title: '浏览器指纹', url: 'https://www.browserscan.net/zh', logo_url: 'https://api.xinac.net/icon/?url=https://www.browserscan.net&sz=128', desc: '浏览器指纹查询'  },
            { menu: 'Home', title: 'nezha面板', url: 'https://ssss.nyc.mn', logo_url: 'https://api.xinac.net/icon/?url=https://ssss.nyc.mn&sz=128', desc: 'nezha面板'  },
            { menu: 'Home', title: 'Api测试', url: 'https://hoppscotch.io', logo_url: 'https://api.xinac.net/icon/?url=https://hoppscotch.io&sz=128', desc: '在线api测试工具'  },
            { menu: 'Home', title: '域名检查', url: 'https://who.cx', logo_url: 'https://api.xinac.net/icon/?url=https://who.cx&sz=128', desc: '域名可用性查询' },
            { menu: 'Home', title: '域名比价', url: 'https://www.whois.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.whois.com&sz=128', desc: '域名价格比较' },
            { menu: 'Home', title: 'NodeSeek', url: 'https://www.nodeseek.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.nodeseek.com&sz=128', desc: '主机论坛' },
            { menu: 'Home', title: 'Linux do', url: 'https://linux.do', logo_url: 'https://api.xinac.net/icon/?url=https://linux.do&sz=128', desc: '新的理想型社区' },
            { menu: 'Home', title: '在线音乐', url: 'https://music.eooce.com', logo_url: 'https://api.xinac.net/icon/?url=https://music.eooce.com&sz=128', desc: '在线音乐' },
            { menu: 'Home', title: '在线电影', url: 'https://libretv.eooce.com', logo_url: 'https://api.xinac.net/icon/?url=https://libretv.eooce.com&sz=128', desc: '在线电影'  },
            { menu: 'Home', title: '免费接码', url: 'https://www.smsonline.cloud/zh', logo_url: 'https://api.xinac.net/icon/?url=https://www.smsonline.cloud&sz=128', desc: '免费接收短信验证码' },
            { menu: 'Home', title: '订阅转换', url: 'https://sublink.eooce.com', logo_url: 'https://api.xinac.net/icon/?url=https://sublink.eooce.com&sz=128', desc: '最好用的订阅转换工具' },
            { menu: 'Home', title: 'webssh', url: 'https://ssh.eooce.com', logo_url: 'https://api.xinac.net/icon/?url=https://ssh.eooce.com&sz=128', desc: '最好用的webssh终端管理工具' },
            { menu: 'Home', title: '文件快递柜', url: 'https://filebox.nnuu.nyc.mn', logo_url: 'https://api.xinac.net/icon/?url=https://filebox.nnuu.nyc.mn&sz=128', desc: '文件输出分享' },
            { menu: 'Home', title: '真实地址生成', url: 'https://address.nnuu.nyc.mn', logo_url: 'https://api.xinac.net/icon/?url=https://address.nnuu.nyc.mn&sz=128', desc: '基于当前ip生成真实的地址' },
            // AI Stuff
            { menu: 'Ai Stuff', title: 'ChatGPT', url: 'https://chat.openai.com', logo_url: 'https://api.xinac.net/icon/?url=https://chat.openai.com&sz=128', desc: 'OpenAI官方AI对话' },
            { menu: 'Ai Stuff', title: 'Deepseek', url: 'https://www.deepseek.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.deepseek.com&sz=128', desc: 'Deepseek AI搜索' },
            { menu: 'Ai Stuff', title: 'Claude', url: 'https://claude.ai', logo_url: 'https://api.xinac.net/icon/?url=https://claude.ai&sz=128', desc: 'Anthropic Claude AI' },
            { menu: 'Ai Stuff', title: 'Google Gemini', url: 'https://gemini.google.com', logo_url: 'https://api.xinac.net/icon/?url=https://gemini.google.com&sz=128', desc: 'Google Gemini大模型' },
            { menu: 'Ai Stuff', title: '阿里千问', url: 'https://chat.qwenlm.ai', logo_url: 'https://api.xinac.net/icon/?url=https://chat.qwenlm.ai&sz=128', desc: '阿里云千问大模型' },
            { menu: 'Ai Stuff', title: 'Kimi', url: 'https://www.kimi.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.kimi.com&sz=128', desc: '月之暗面Moonshot AI' },
            // AI Stuff - 子菜单卡片
            { subMenu: 'AI chat', title: 'ChatGPT', url: 'https://chat.openai.com', logo_url: 'https://api.xinac.net/icon/?url=https://chat.openai.com&sz=128', desc: 'OpenAI官方AI对话' },
            { subMenu: 'AI chat', title: 'Deepseek', url: 'https://www.deepseek.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.deepseek.com&sz=128', desc: 'Deepseek AI搜索' },
            // AI Stuff - 子菜单卡片
            { subMenu: 'AI tools', title: 'ChatGPT', url: 'https://chat.openai.com', logo_url: 'https://api.xinac.net/icon/?url=https://chat.openai.com&sz=128', desc: 'OpenAI官方AI对话' },
            { subMenu: 'AI tools', title: 'Deepseek', url: 'https://www.deepseek.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.deepseek.com&sz=128', desc: 'Deepseek AI搜索' },
            // Cloud
            { menu: 'Cloud', title: '阿里云', url: 'https://www.aliyun.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.aliyun.com&sz=128', desc: '阿里云官网' },
            { menu: 'Cloud', title: '腾讯云', url: 'https://cloud.tencent.com', logo_url: 'https://api.xinac.net/icon/?url=https://cloud.tencent.com&sz=128', desc: '腾讯云官网' },
            { menu: 'Cloud', title: '甲骨文云', url: 'https://cloud.oracle.com', logo_url: 'https://api.xinac.net/icon/?url=https://cloud.oracle.com&sz=128', desc: 'Oracle Cloud' },
            { menu: 'Cloud', title: '亚马逊云', url: 'https://aws.amazon.com', logo_url: 'https://api.xinac.net/icon/?url=https://aws.amazon.com&sz=128', desc: 'Amazon AWS' },
            { menu: 'Cloud', title: 'DigitalOcean', url: 'https://www.digitalocean.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.digitalocean.com&sz=128', desc: 'DigitalOcean VPS' },
            { menu: 'Cloud', title: 'Vultr', url: 'https://www.vultr.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.vultr.com&sz=128', desc: 'Vultr VPS' },
            // Software
            { menu: 'Software', title: 'Hellowindows', url: 'https://hellowindows.cn', logo_url: 'https://api.xinac.net/icon/?url=https://hellowindows.cn&sz=128', desc: 'windows系统及office下载' },
            { menu: 'Software', title: '奇迹秀', url: 'https://www.qijishow.com/down', logo_url: 'https://api.xinac.net/icon/?url=https://www.qijishow.com&sz=128', desc: '设计师的百宝箱' },
            { menu: 'Software', title: '易破解', url: 'https://www.ypojie.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.ypojie.com&sz=128', desc: '精品windows软件' },
            { menu: 'Software', title: '软件先锋', url: 'https://topcracked.com', logo_url: 'https://api.xinac.net/icon/?url=https://topcracked.com&sz=128', desc: '精品windows软件' },
            { menu: 'Software', title: 'Macwk', url: 'https://www.macwk.com', logo_url: 'https://api.xinac.net/icon/?url=https://www.macwk.com&sz=128', desc: '精品Mac软件' },
            { menu: 'Software', title: 'Macsc', url: 'https://mac.macsc.com', logo_url: 'https://api.xinac.net/icon/?url=https://mac.macsc.com&sz=128', desc: '' },
            // Tools
            { menu: 'Tools', title: 'JSON工具', url: 'https://www.json.cn', logo_url: 'https://api.xinac.net/icon/?url=https://www.json.cn&sz=128', desc: 'JSON格式化/校验' },
            { menu: 'Tools', title: 'base64工具', url: 'https://www.qqxiuzi.cn/bianma/base64.htm', logo_url: 'https://api.xinac.net/icon/?url=https://www.qqxiuzi.cn&sz=128', desc: '在线base64编码解码' },
            { menu: 'Tools', title: '二维码生成', url: 'https://cli.im', logo_url: 'https://api.xinac.net/icon/?url=https://cli.im&sz=128', desc: '二维码生成工具' },
            { menu: 'Tools', title: 'JS混淆', url: 'https://obfuscator.io', logo_url: 'https://api.xinac.net/icon/?url=https://obfuscator.io&sz=128', desc: '在线Javascript代码混淆' },
            { menu: 'Tools', title: 'Python混淆', url: 'https://freecodingtools.org/tools/obfuscator/python', logo_url: 'https://api.xinac.net/icon/?url=https://freecodingtools.org&sz=128', desc: '在线python代码混淆' },
            { menu: 'Tools', title: 'Remove.photos', url: 'https://remove.photos/zh-cn', logo_url: 'https://api.xinac.net/icon/?url=https://remove.photos&sz=128', desc: '一键抠图' },
            // Tools - Dev Tools 子菜单卡片
            { subMenu: 'Dev Tools', title: 'Uiverse', url: 'https://uiverse.io/elements', logo_url: 'https://api.xinac.net/icon/?url=https://uiverse.io&sz=128', desc: 'CSS动画和设计元素' },
            { subMenu: 'Dev Tools', title: 'Icons8', url: 'https://igoutu.cn/icons', logo_url: 'https://api.xinac.net/icon/?url=https://igoutu.cn&sz=128', desc: '免费图标和设计资源' },
            // Other
            { menu: 'Other', title: 'Gmail', url: 'https://mail.google.com', logo_url: 'https://api.xinac.net/icon/?url=https://mail.google.com&sz=128', desc: 'Google邮箱' },
            { menu: 'Other', title: 'Outlook', url: 'https://outlook.live.com', logo_url: 'https://api.xinac.net/icon/?url=https://outlook.live.com&sz=128', desc: '微软Outlook邮箱' },
            { menu: 'Other', title: 'Proton Mail', url: 'https://account.proton.me', logo_url: 'https://api.xinac.net/icon/?url=https://account.proton.me&sz=128', desc: '安全加密邮箱' },
            { menu: 'Other', title: 'QQ邮箱', url: 'https://mail.qq.com', logo_url: 'https://api.xinac.net/icon/?url=https://mail.qq.com&sz=128', desc: '腾讯QQ邮箱' },
            { menu: 'Other', title: '雅虎邮箱', url: 'https://mail.yahoo.com', logo_url: 'https://api.xinac.net/icon/?url=https://mail.yahoo.com&sz=128', desc: '雅虎邮箱' },
            { menu: 'Other', title: '10分钟临时邮箱', url: 'https://linshiyouxiang.net', logo_url: 'https://api.xinac.net/icon/?url=https://linshiyouxiang.net&sz=128', desc: '10分钟临时邮箱' },
          ];
          
          const cardStmt = db.prepare('INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc) VALUES (?, ?, ?, ?, ?, ?)');
          let cardInsertCount = 0;
          
          cards.forEach(card => {
            if (card.subMenu) {
              // 插入子菜单卡片
              // 查找对应的子菜单ID，需要遍历所有可能的父菜单
              let subMenuId = null;
              for (const [key, id] of Object.entries(subMenuMap)) {
                if (key.endsWith(`_${card.subMenu}`)) {
                  subMenuId = id;
                  break;
                }
              }
              
              if (subMenuId) {
                cardStmt.run(null, subMenuId, card.title, card.url, card.logo_url, card.desc, function(err) {
                  if (err) {
                    console.error(`插入子菜单卡片失败 [${card.subMenu}] ${card.title}:`, err);
                  } else {
                    cardInsertCount++;
                    console.log(`成功插入子菜单卡片 [${card.subMenu}] ${card.title}`);
                  }
                });
              } else {
                console.warn(`未找到子菜单: ${card.subMenu}`);
              }
            } else if (menuMap[card.menu]) {
              // 插入主菜单卡片
              cardStmt.run(menuMap[card.menu], null, card.title, card.url, card.logo_url, card.desc, function(err) {
                if (err) {
                  console.error(`插入卡片失败 [${card.menu}] ${card.title}:`, err);
                } else {
                  cardInsertCount++;
                  console.log(`成功插入卡片 [${card.menu}] ${card.title}`);
                }
              });
            } else {
              console.warn(`未找到菜单: ${card.menu}`);
            }
          });
          
          cardStmt.finalize(() => {
            console.log(`所有卡片插入完成，总计: ${cardInsertCount} 张卡片`);
          });
        });
      } else {
        console.log('未找到任何菜单');
      }
    });
  }

  // 插入默认管理员账号
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (row && row.count === 0) {
      const passwordHash = bcrypt.hashSync(config.admin.password, 10);
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [config.admin.username, passwordHash]);
    }
  });

  // 插入默认友情链接
  db.get('SELECT COUNT(*) as count FROM friends', (err, row) => {
    if (row && row.count === 0) {
      const defaultFriends = [
        ['Noodseek图床', 'https://www.nodeimage.com', 'https://www.nodeseek.com/static/image/favicon/favicon-32x32.png'],
        ['Font Awesome', 'https://fontawesome.com', 'https://fontawesome.com/favicon.ico']
      ];
      const stmt = db.prepare('INSERT INTO friends (title, url, logo) VALUES (?, ?, ?)');
      defaultFriends.forEach(([title, url, logo]) => stmt.run(title, url, logo));
      stmt.finalize();
    }
  });

  // 尝试添加登录信息列（如果表已存在但没有这些列）
  // 静默处理错误，因为如果列已存在会报错
  db.run(`ALTER TABLE users ADD COLUMN last_login_time TEXT`, [], () => {});
  db.run(`ALTER TABLE users ADD COLUMN last_login_ip TEXT`, [], () => {});
});


module.exports = db; 
