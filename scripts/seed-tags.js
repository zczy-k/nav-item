const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/nav.db');
const db = new sqlite3.Database(dbPath);

// Promisify database operations
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// 预置标签配置
const DEFAULT_TAGS = [
  { name: '搜索引擎', color: '#3b82f6', order: 1 },
  { name: '视频', color: '#ef4444', order: 2 },
  { name: '邮箱', color: '#10b981', order: 3 },
  { name: '开发工具', color: '#8b5cf6', order: 4 },
  { name: 'AI工具', color: '#f59e0b', order: 5 },
  { name: '云服务', color: '#06b6d4', order: 6 },
  { name: '社交媒体', color: '#ec4899', order: 7 },
  { name: '工具', color: '#6366f1', order: 8 },
  { name: '软件下载', color: '#14b8a6', order: 9 },
  { name: '网络工具', color: '#f97316', order: 10 },
  { name: '娱乐', color: '#a855f7', order: 11 },
  { name: '社区', color: '#84cc16', order: 12 },
  { name: '图片处理', color: '#22d3ee', order: 13 },
  { name: '域名工具', color: '#fb923c', order: 14 }
];

// 卡片URL到标签的映射规则
const CARD_TAG_RULES = [
  // 搜索引擎
  { urlPattern: 'baidu.com', tags: ['搜索引擎'] },
  { urlPattern: 'google.com', tags: ['搜索引擎', '邮箱'] }, // Gmail
  
  // 视频
  { urlPattern: 'youtube.com', tags: ['视频', '社交媒体'] },
  { urlPattern: 'music.eooce.com', tags: ['娱乐'] },
  { urlPattern: 'libretv.eooce.com', tags: ['视频', '娱乐'] },
  
  // 开发工具
  { urlPattern: 'github.com', tags: ['开发工具', '社区'] },
  { urlPattern: 'hoppscotch.io', tags: ['开发工具', '工具'] },
  { urlPattern: 'json.cn', tags: ['开发工具', '工具'] },
  { urlPattern: 'obfuscator.io', tags: ['开发工具', '工具'] },
  { urlPattern: 'freecodingtools.org', tags: ['开发工具', '工具'] },
  { urlPattern: 'uiverse.io', tags: ['开发工具'] },
  { urlPattern: 'igoutu.cn', tags: ['开发工具'] },
  
  // AI工具
  { urlPattern: 'chat.openai.com', tags: ['AI工具'] },
  { urlPattern: 'deepseek.com', tags: ['AI工具'] },
  { urlPattern: 'claude.ai', tags: ['AI工具'] },
  { urlPattern: 'gemini.google.com', tags: ['AI工具'] },
  { urlPattern: 'chat.qwenlm.ai', tags: ['AI工具'] },
  { urlPattern: 'kimi.com', tags: ['AI工具'] },
  { urlPattern: 'huggingface.co', tags: ['AI工具', '开发工具'] },
  
  // 云服务
  { urlPattern: 'cloudflare.com', tags: ['云服务', '网络工具'] },
  { urlPattern: 'aliyun.com', tags: ['云服务'] },
  { urlPattern: 'cloud.tencent.com', tags: ['云服务'] },
  { urlPattern: 'cloud.oracle.com', tags: ['云服务'] },
  { urlPattern: 'aws.amazon.com', tags: ['云服务'] },
  { urlPattern: 'digitalocean.com', tags: ['云服务'] },
  { urlPattern: 'vultr.com', tags: ['云服务'] },
  
  // 网络工具
  { urlPattern: 'ip.sb', tags: ['网络工具', '工具'] },
  { urlPattern: 'ping0.cc', tags: ['网络工具', '工具'] },
  { urlPattern: 'itdog.cn', tags: ['网络工具', '工具'] },
  { urlPattern: 'browserscan.net', tags: ['网络工具', '工具'] },
  { urlPattern: 'ssss.nyc.mn', tags: ['网络工具', '工具'] },
  { urlPattern: 'ssh.eooce.com', tags: ['网络工具', '工具'] },
  { urlPattern: 'sublink.eooce.com', tags: ['网络工具', '工具'] },
  
  // 域名工具
  { urlPattern: 'who.cx', tags: ['域名工具', '工具'] },
  { urlPattern: 'whois.com', tags: ['域名工具', '工具'] },
  
  // 社区
  { urlPattern: 'nodeseek.com', tags: ['社区'] },
  { urlPattern: 'linux.do', tags: ['社区'] },
  
  // 邮箱
  { urlPattern: 'mail.google.com', tags: ['邮箱'] },
  { urlPattern: 'outlook.live.com', tags: ['邮箱'] },
  { urlPattern: 'account.proton.me', tags: ['邮箱'] },
  { urlPattern: 'mail.qq.com', tags: ['邮箱'] },
  { urlPattern: 'mail.yahoo.com', tags: ['邮箱'] },
  { urlPattern: 'linshiyouxiang.net', tags: ['邮箱', '工具'] },
  { urlPattern: 'smsonline.cloud', tags: ['工具'] },
  
  // 软件下载
  { urlPattern: 'hellowindows.cn', tags: ['软件下载'] },
  { urlPattern: 'qijishow.com', tags: ['软件下载'] },
  { urlPattern: 'ypojie.com', tags: ['软件下载'] },
  { urlPattern: 'topcracked.com', tags: ['软件下载'] },
  { urlPattern: 'macwk.com', tags: ['软件下载'] },
  { urlPattern: 'mac.macsc.com', tags: ['软件下载'] },
  
  // 其他工具
  { urlPattern: 'qqxiuzi.cn', tags: ['工具'] },
  { urlPattern: 'cli.im', tags: ['工具'] },
  { urlPattern: 'remove.photos', tags: ['图片处理', '工具'] },
  { urlPattern: 'filebox.nnuu.nyc.mn', tags: ['工具'] },
  { urlPattern: 'address.nnuu.nyc.mn', tags: ['工具'] }
];

async function seedTags() {
  try {
    console.log('→ 开始预置标签...\n');
    await dbRun('BEGIN TRANSACTION');
    
    // 检查标签表是否已有数据
    const tagCount = await dbGet('SELECT COUNT(*) as count FROM tags');
    
    if (tagCount.count > 0) {
      console.log(`  ℹ 标签表已有 ${tagCount.count} 个标签，跳过预置\n`);
      await dbRun('COMMIT');
      
      // 直接进行标签分配
      await assignTagsToCards();
      return;
    }
    
    // 插入默认标签
    const tagMap = {};
    for (const tag of DEFAULT_TAGS) {
      const result = await dbRun(
        'INSERT INTO tags (name, color, "order") VALUES (?, ?, ?)',
        [tag.name, tag.color, tag.order]
      );
      tagMap[tag.name] = result.lastID;
      console.log(`  ✓ 创建标签: ${tag.name} (颜色: ${tag.color}, ID: ${result.lastID})`);
    }
    
    await dbRun('COMMIT');
    console.log(`\n✓ 成功预置 ${DEFAULT_TAGS.length} 个标签\n`);
    
    // 为卡片分配标签
    await assignTagsToCards(tagMap);
    
  } catch (error) {
    await dbRun('ROLLBACK');
    console.error('✗ 预置标签失败:', error);
    throw error;
  }
}

async function assignTagsToCards(tagMap) {
  try {
    console.log('→ 开始为卡片分配标签...\n');
    
    // 如果没有传入tagMap，则从数据库读取
    if (!tagMap) {
      const tags = await dbAll('SELECT id, name FROM tags');
      tagMap = {};
      tags.forEach(tag => {
        tagMap[tag.name] = tag.id;
      });
    }
    
    // 获取所有卡片
    const cards = await dbAll('SELECT id, url, title FROM cards');
    console.log(`  找到 ${cards.length} 张卡片\n`);
    
    let assignCount = 0;
    await dbRun('BEGIN TRANSACTION');
    
    for (const card of cards) {
      const matchedTags = new Set();
      
      // 根据URL匹配标签
      for (const rule of CARD_TAG_RULES) {
        if (card.url.includes(rule.urlPattern)) {
          rule.tags.forEach(tagName => {
            if (tagMap[tagName]) {
              matchedTags.add(tagMap[tagName]);
            }
          });
        }
      }
      
      // 插入卡片-标签关联
      if (matchedTags.size > 0) {
        for (const tagId of matchedTags) {
          // 检查是否已存在关联
          const existing = await dbGet(
            'SELECT 1 FROM card_tags WHERE card_id = ? AND tag_id = ?',
            [card.id, tagId]
          );
          
          if (!existing) {
            await dbRun(
              'INSERT INTO card_tags (card_id, tag_id) VALUES (?, ?)',
              [card.id, tagId]
            );
          }
        }
        
        const tagNames = Array.from(matchedTags).map(id => {
          return Object.keys(tagMap).find(name => tagMap[name] === id);
        }).join(', ');
        
        console.log(`  ✓ ${card.title}: [${tagNames}]`);
        assignCount++;
      }
    }
    
    await dbRun('COMMIT');
    console.log(`\n✓ 成功为 ${assignCount} 张卡片分配标签`);
    
  } catch (error) {
    await dbRun('ROLLBACK');
    console.error('✗ 分配标签失败:', error);
    throw error;
  } finally {
    db.close();
  }
}

// 执行脚本
seedTags()
  .then(() => {
    console.log('\n🎉 标签预置和分配完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 执行失败:', error);
    process.exit(1);
  });
