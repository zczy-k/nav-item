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
      // 使用 picsum.photos 备用，通过 seed 参数确保每次请求获取不同但固定的图片
      const seed = Date.now();
      const fallbackResponse = await axios.get(`https://picsum.photos/1920/1080?random=${seed}`, {
        maxRedirects: 0,
        validateStatus: (status) => status === 302 || status === 200,
      });
      
      // 获取重定向后的固定 URL
      const fallbackUrl = fallbackResponse.headers.location || fallbackResponse.request.res.responseUrl || `https://picsum.photos/id/${seed % 1000}/1920/1080`;
      
      res.json({ 
        success: true,
        url: fallbackUrl 
      });
    } catch (e) {
      // 最后的备用：返回一个固定 ID 的图片
      const fixedId = Date.now() % 1000;
      res.json({ 
        success: true,
        url: `https://picsum.photos/id/${fixedId}/1920/1080` 
      });
    }
  }
});

module.exports = router;
