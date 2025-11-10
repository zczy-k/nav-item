const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { uploadLimiter } = require('../middleware/security');
const authMiddleware = require('./authMiddleware');
const router = express.Router();

// 允许的文件类型（MIME类型和扩展名）
const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'image/x-icon': ['.ico'],
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    // 使用加密随机文件名，防止猬测
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制5MB
    files: 1, // 一次只能上传1个文件
  },
  fileFilter: function (req, file, cb) {
    // 验证MIME类型
    if (!ALLOWED_TYPES[file.mimetype]) {
      return cb(new Error('不支持的文件类型，只允许上传图片文件'));
    }
    
    // 验证扩展名
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_TYPES[file.mimetype].includes(ext)) {
      return cb(new Error('文件扩展名与类型不匹配'));
    }
    
    // 验证文件名长度
    if (file.originalname.length > 255) {
      return cb(new Error('文件名过长'));
    }
    
    cb(null, true);
  }
});

// 文件上传需要认证和限流
router.post('/', authMiddleware, uploadLimiter, (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: '文件太大，最大允联5MB' });
      }
      return res.status(400).json({ error: '文件上传失败: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }
    
    res.json({
      success: true,
      filename: req.file.filename,
      url: '/uploads/' + req.file.filename,
      size: req.file.size,
    });
  });
});

module.exports = router;
