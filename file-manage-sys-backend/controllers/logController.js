const Log = require('../models/log');
const ResponseUtil = require('../utils/response');
const logger = require('../config/logger');

class LogController {
  /**
   * 获取日志列表
   */
  static async list(req, res) {
    try {
      const {
        page = 1,
        pageSize = 10,
        userId,
        action,
        targetType,
        startDate,
        endDate
      } = req.query;

      // 检查权限（只有管理员可以查看所有日志）
      if (req.user.role !== 'admin') {
        return res.status(403).json(ResponseUtil.error('需要管理员权限'));
      }

      const filters = {
        userId,
        action,
        targetType,
        startDate,
        endDate
      };

      const result = await Log.list(filters, parseInt(page), parseInt(pageSize));
      res.json(ResponseUtil.success(result));
    } catch (error) {
      logger.error('获取日志列表失败:', error);
      res.status(500).json(ResponseUtil.error('获取日志列表失败'));
    }
  }

  /**
   * 获取日志详情
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      // 检查权限
      if (req.user.role !== 'admin') {
        return res.status(403).json(ResponseUtil.error('需要管理员权限'));
      }

      const log = await Log.getById(id);
      if (!log) {
        return res.status(404).json(ResponseUtil.error('日志不存在'));
      }

      res.json(ResponseUtil.success(log));
    } catch (error) {
      logger.error('获取日志详情失败:', error);
      res.status(500).json(ResponseUtil.error('获取日志详情失败'));
    }
  }

  /**
   * 删除日志
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // 检查权限
      if (req.user.role !== 'admin') {
        return res.status(403).json(ResponseUtil.error('需要管理员权限'));
      }

      const success = await Log.delete(id);
      if (!success) {
        return res.status(404).json(ResponseUtil.error('日志不存在'));
      }

      logger.info(`删除日志: ${id}`);
      res.json(ResponseUtil.success(null, '日志删除成功'));
    } catch (error) {
      logger.error('删除日志失败:', error);
      res.status(500).json(ResponseUtil.error('删除日志失败'));
    }
  }

  /**
   * 清理旧日志
   */
  static async cleanOldLogs(req, res) {
    try {
      const { days = 30 } = req.body;

      // 检查权限
      if (req.user.role !== 'admin') {
        return res.status(403).json(ResponseUtil.error('需要管理员权限'));
      }

      await Log.cleanOldLogs(days);
      logger.info(`清理${days}天前的日志`);
      res.json(ResponseUtil.success(null, '日志清理成功'));
    } catch (error) {
      logger.error('清理日志失败:', error);
      res.status(500).json(ResponseUtil.error('清理日志失败'));
    }
  }
}

module.exports = LogController; 