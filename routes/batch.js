const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db');
const auth = require('./authMiddleware');
const router = express.Router();

// 批量解析网址信息
router.post('/parse', auth, async (req, res) => {
  const { urls } = req.body;

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: '请提供有效的网址列表' });
  }

  const results = [];
  
  for (const url of urls) {
    try {
      // 验证URL格式
      const urlObj = new URL(url);
      
      // 抓取网页内容（设置超时和User-Agent）
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        maxRedirects: 5
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // 提取标题
      let title = $('title').text().trim();
      if (!title) {
        title = $('meta[property="og:title"]').attr('content');
      }
      if (!title) {
        title = urlObj.hostname;
      }

      // 提取描述
      let description = $('meta[name="description"]').attr('content');
      if (!description) {
        description = $('meta[property="og:description"]').attr('content');
      }
      if (!description) {
        description = '';
      }
      description = description.trim().substring(0, 200);

      // 提取Logo
      let logo = $('link[rel="icon"]').attr('href') || 
                 $('link[rel="shortcut icon"]').attr('href') ||
                 $('link[rel="apple-touch-icon"]').attr('href') ||
                 $('meta[property="og:image"]').attr('content');

      // 处理相对路径
      if (logo) {
        if (!logo.startsWith('http')) {
          logo = new URL(logo, url).href;
        }
      } else {
        logo = `${urlObj.origin}/favicon.ico`;
      }

      results.push({
        url: url,
        title: title,
        logo: logo,
        description: description,
        success: true
      });

    } catch (error) {
      console.error(`解析失败 ${url}:`, error.message);
      
      // 即使失败也返回基本信息
      try {
        const urlObj = new URL(url);
        results.push({
          url: url,
          title: urlObj.hostname,
          logo: `${urlObj.origin}/favicon.ico`,
          description: '',
          success: false,
          error: error.message
        });
      } catch (e) {
        results.push({
          url: url,
          title: url,
          logo: '',
          description: '',
          success: false,
          error: '无效的URL'
        });
      }
    }
  }

  res.json({ data: results });
});

// 批量添加卡片
router.post('/add', auth, (req, res) => {
  const { menu_id, sub_menu_id, cards } = req.body;

  if (!menu_id || !cards || !Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ error: '请提供有效的菜单ID和卡片列表' });
  }

  // 获取当前最大的 order 值
  const orderQuery = sub_menu_id 
    ? 'SELECT MAX("order") as max_order FROM cards WHERE sub_menu_id = ?'
    : 'SELECT MAX("order") as max_order FROM cards WHERE menu_id = ? AND sub_menu_id IS NULL';
  
  const orderParams = sub_menu_id ? [sub_menu_id] : [menu_id];

  db.get(orderQuery, orderParams, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    let nextOrder = (row && row.max_order !== null) ? row.max_order + 1 : 0;
    const insertedIds = [];
    let completed = 0;
    let hasError = false;

    // 逐个插入卡片
    cards.forEach((card, index) => {
      const { title, url, logo, description } = card;
      const order = nextOrder + index;

      db.run(
        'INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, "order") VALUES (?, ?, ?, ?, ?, ?, ?)',
        [menu_id, sub_menu_id || null, title, url, logo, description, order],
        function(err) {
          if (err && !hasError) {
            hasError = true;
            return res.status(500).json({ error: err.message });
          }
          
          if (!hasError) {
            insertedIds.push(this.lastID);
            completed++;

            if (completed === cards.length) {
              res.json({ 
                success: true, 
                count: insertedIds.length,
                ids: insertedIds 
              });
            }
          }
        }
      );
    });
  });
});

module.exports = router;
