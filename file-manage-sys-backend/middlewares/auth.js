const jwt = require('jsonwebtoken');
const ResponseUtil = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = {
  /**
   * 验证JWT token
   */
  verifyToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json(ResponseUtil.error('未提供认证令牌'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json(ResponseUtil.error('无效的认证令牌'));
    }
  },

  /**
   * 验证管理员权限
   */
  isAdmin: (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json(ResponseUtil.error('需要管理员权限'));
    }
  }
};

module.exports = auth; 