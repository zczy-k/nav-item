// 统一错误处理中间件

// 安全的错误响应（不暴露敏感信息）
function safeErrorResponse(err, req, res) {
  // 开发环境显示详细错误，生产环境隐藏
  const isDev = process.env.NODE_ENV === 'development';
  
  // 记录完整错误日志（服务端）
  console.error('[Error]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    error: err.message,
    stack: isDev ? err.stack : undefined,
  });
  
  // 根据错误类型返回适当的状态码
  let statusCode = err.statusCode || err.status || 500;
  let message = '服务器错误，请稍后重试';
  
  // 已知的客户端错误
  if (statusCode >= 400 && statusCode < 500) {
    message = err.message || '请求错误';
  }
  
  // 特定错误类型处理
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '输入验证失败';
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '身份验证失败，请重新登录';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '登录已过期，请重新登录';
  } else if (err.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409;
    message = '数据冲突，请检查输入';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = '文件太大，请上传较小的文件';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = '不支持的文件类型';
  }
  
  // 构造响应对象
  const response = {
    success: false,
    error: message,
  };
  
  // 开发环境添加详细信息
  if (isDev && err.stack) {
    response.stack = err.stack;
    response.details = err.message;
  }
  
  res.status(statusCode).json(response);
}

// 404错误处理
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: '请求的资源不存在',
  });
}

// 全局错误处理
function globalErrorHandler(err, req, res, next) {
  safeErrorResponse(err, req, res);
}

// 异步错误包装器
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 验证错误格式化（express-validator）
function formatValidationErrors(errors) {
  return errors.array().map(err => ({
    field: err.param,
    message: err.msg,
  }));
}

module.exports = {
  safeErrorResponse,
  notFoundHandler,
  globalErrorHandler,
  asyncHandler,
  formatValidationErrors,
};
