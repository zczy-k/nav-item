const express = require('express');
const axios = require('axios');
const router = express.Router();

// 获取随机壁纸
router.get('/random', async (req, res) => {
  try {
    // 使用Unsplash API获取随机壁纸
    // 参数: 1920x1080分辨率，自然/风景类别
    const response = await axios.get('https://source.unsplash.com/random/1920x1080', {
      params: {
        nature: '', // 自然类别
      },
      maxRedirects: 0, // 不跟随重定向，获取实际图片URL
      validateStatus: (status) => status === 302 || status === 200
    });
    
    // Unsplash会返回302重定向到实际图片
    const imageUrl = response.request?.res?.responseUrl || response.config.url;
    
    res.json({ 
      success: true,
      url: imageUrl 
    });
  } catch (error) {
    // 如果Unsplash失败，使用备用壁纸源
    try {
      const fallbackUrl = `https://picsum.photos/1920/1080?random=${Date.now()}`;
      res.json({ 
        success: true,
        url: fallbackUrl 
      });
    } catch (e) {
      res.status(500).json({ 
        error: '获取壁纸失败',
        message: error.message 
      });
    }
  }
});

module.exports = router;
