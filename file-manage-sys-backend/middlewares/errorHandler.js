const logger = require('../config/logger');
const ResponseUtil = require('../utils/response');

function errorHandler(err, req, res, next) {
  // 记录错误日志
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // 根据错误类型返回不同的状态码
  if (err.name === 'ValidationError') {
    return res.status(400).json(ResponseUtil.error(err.message));
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(ResponseUtil.error('认证失败'));
  }

  // 默认返回500错误
  return res.status(500).json(ResponseUtil.error('服务器内部错误'));
}

module.exports = errorHandler; 