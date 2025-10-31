const express = require('express');
const axios = require('axios');
const router = express.Router();

// 获取随机壁纸
router.get('/random', async (req, res) => {
  try {
    const response = await axios.get('https://source.unsplash.com/random/1920x1080?nature,water', {
      maxRedirects: 0,
      validateStatus: (status) => status === 302 || status === 200, // 接受302重定向
    });

    // 从响应头的 'location' 字段获取最终的图片 URL
    const imageUrl = response.headers.location;

    if (imageUrl) {
      res.json({ 
        success: true,
        url: imageUrl 
      });
    } else {
      // 如果没有获取到 location，抛出错误以触发备用方案
      throw new Error('Unsplash did not provide a redirect location.');
    }

  } catch (error) {
    // 如果Unsplash失败，使用备用壁纸源
    console.error('Unsplash request failed, using fallback:', error.message);
    try {
      const fallbackUrl = `https://picsum.photos/1920/1080?random=${Date.now()}`;
      res.json({ 
        success: true,
        url: fallbackUrl 
      });
    } catch (e) {
      res.status(500).json({ 
        error: '获取壁纸失败',
        message: e.message 
      });
    }
  }
});

module.exports = router;
