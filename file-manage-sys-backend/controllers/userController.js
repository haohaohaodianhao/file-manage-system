const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ResponseUtil = require('../utils/response');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

class UserController {
  /**
   * 用户注册
   */
  static async register(req, res) {
    try {
      const { username, password } = req.body;

      // 检查用户是否已存在
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json(ResponseUtil.error('用户名已存在'));
      }

      // 创建新用户
      const user = await User.create({ username, password });
      
      logger.info(`新用户注册: ${username}`);
      res.status(201).json(ResponseUtil.success(user, '注册成功'));
    } catch (error) {
      logger.error('注册失败:', error);
      res.status(500).json(ResponseUtil.error('注册失败'));
    }
  }

  /**
   * 用户登录
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // 查找用户
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json(ResponseUtil.error('用户名或密码错误'));
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json(ResponseUtil.error('用户名或密码错误'));
      }

      // 更新最后登录时间
      await User.updateLastLogin(user.id);

      // 生成JWT令牌
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      logger.info(`用户登录: ${username}`);
      res.json(ResponseUtil.success({ token }, '登录成功'));
    } catch (error) {
      logger.error('登录失败:', error);
      res.status(500).json(ResponseUtil.error('登录失败'));
    }
  }
}

module.exports = UserController; 