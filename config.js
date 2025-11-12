require('dotenv').config();
const path = require('path');

// 支持 Fly.io 和 Railway 的持久化存储路径
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const IS_FLY_IO = process.env.FLY_APP_NAME !== undefined;
const IS_RAILWAY = process.env.RAILWAY_ENVIRONMENT !== undefined;

module.exports = {
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || '123456'
  },
  server: {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || 'Con-Nav-Item-jwt-secret-2024-secure-key'
  },
  paths: {
    data: DATA_DIR,
    database: path.join(DATA_DIR, 'database'),
    uploads: path.join(DATA_DIR, 'uploads'),
    backups: path.join(DATA_DIR, 'backups'),
    config: path.join(DATA_DIR, 'config')
  },
  platform: {
    isFlyIo: IS_FLY_IO,
    isRailway: IS_RAILWAY,
    isCloud: IS_FLY_IO || IS_RAILWAY
  }
};
