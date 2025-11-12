const jwt = require('jsonwebtoken');
const config = require('../config');

const JWT_SECRET = config.server.jwtSecret;

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: '无效token' });
  }
}

module.exports = authMiddleware;
