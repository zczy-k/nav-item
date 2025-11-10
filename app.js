const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const menuRoutes = require('./routes/menu');
const cardRoutes = require('./routes/card');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ad');
const friendRoutes = require('./routes/friend');
const userRoutes = require('./routes/user');
const batchRoutes = require('./routes/batch');
const wallpaperRoutes = require('./routes/wallpaper');
const searchEngineRoutes = require('./routes/searchEngine');
const backupRoutes = require('./routes/backup');
const compression = require('compression');
const { helmetConfig, sanitizeMiddleware, generalLimiter } = require('./middleware/security');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const app = express();

// 简单的内存缓存
const cache = new Map();
const CACHE_TTL = 60000; // 1分钟缓存

const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmetConfig);
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  maxAge: 86400,
}));
app.use(express.json({ limit: '10mb' }));
app.use(compression());

// 输入清理中间件
app.use(sanitizeMiddleware);

// API请求限流（仅针对API路由）
app.use('/api', generalLimiter);

// 缓存中间件（仅对GET请求）
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/api/')) {
    const cacheKey = req.originalUrl;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }
    // 拦截res.json以缓存响应
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return originalJson(data);
    };
  }
  next();
});

// 静态资源缓存设置
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  etag: true,
  lastModified: true
}));
app.use(express.static(path.join(__dirname, 'web/dist'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/uploads') &&
    !fs.existsSync(path.join(__dirname, 'web/dist', req.path))
  ) {
    res.sendFile(path.join(__dirname, 'web/dist', 'index.html'));
  } else {
    next();
  }
});

// 清除缓存的辅助函数
app.clearCache = () => cache.clear();

app.use('/api/menus', menuRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/users', userRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/wallpaper', wallpaperRoutes);
app.use('/api/search-engines', searchEngineRoutes);
app.use('/api/backup', backupRoutes);

// 启动定时备份任务
try {
  const { startScheduledBackup } = require('./utils/autoBackup');
  startScheduledBackup();
} catch (error) {
  console.error('自动备份模块加载失败:', error.message);
}

// 定期清理过期缓存
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

// 404错误处理（必须在所有路由之后）
app.use(notFoundHandler);

// 全局错误处理（必须是最后一个中间件）
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`⚡ Server is running at http://localhost:${PORT}`);
  console.log(`🔒 Security features enabled: Helmet, Rate Limiting, Input Sanitization`);
});
