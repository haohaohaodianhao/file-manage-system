const Backup = require('../models/backup');
const File = require('../models/file');
const ResponseUtil = require('../utils/response');
const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class BackupController {
  /**
   * 创建文件备份
   */
  static async create(req, res) {
    try {
      const { fileId } = req.params;
      const file = await File.getById(fileId);

      if (!file) {
        return res.status(404).json(ResponseUtil.error('文件不存在'));
      }

      // 检查权限
      if (file.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json(ResponseUtil.error('没有权限备份此文件'));
      }

      // 获取最新版本号
      const latestVersion = await Backup.getLatestVersion(fileId);
      const newVersion = latestVersion + 1;

      // 创建备份目录
      const backupDir = 'backups/';
      await fs.mkdir(backupDir, { recursive: true });

      // 复制文件到备份目录
      const backupPath = path.join(backupDir, `${uuidv4()}${path.extname(file.original_name)}`);
      await fs.copyFile(file.file_path, backupPath);

      // 创建备份记录
      const backup = await Backup.create({
        fileId,
        backupPath,
        version: newVersion
      });

      // 清理旧备份（保留最新的5个版本）
      await Backup.cleanOldBackups(fileId, 5);

      logger.info(`创建备份: 文件${fileId} 版本${newVersion}`);
      res.json(ResponseUtil.success(backup, '备份创建成功'));
    } catch (error) {
      logger.error('创建备份失败:', error);
      res.status(500).json(ResponseUtil.error('创建备份失败'));
    }
  }

  /**
   * 获取文件的所有备份
   */
  static async list(req, res) {
    try {
      const { fileId } = req.params;
      const file = await File.getById(fileId);

      if (!file) {
        return res.status(404).json(ResponseUtil.error('文件不存在'));
      }

      // 检查权限
      if (file.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json(ResponseUtil.error('没有权限查看此文件的备份'));
      }

      const backups = await Backup.listByFile(fileId);
      res.json(ResponseUtil.success(backups));
    } catch (error) {
      logger.error('获取备份列表失败:', error);
      res.status(500).json(ResponseUtil.error('获取备份列表失败'));
    }
  }

  /**
   * 恢复到指定版本
   */
  static async restore(req, res) {
    try {
      const { fileId, version } = req.params;
      const file = await File.getById(fileId);

      if (!file) {
        return res.status(404).json(ResponseUtil.error('文件不存在'));
      }

      // 检查权限
      if (file.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json(ResponseUtil.error('没有权限恢复此文件'));
      }

      const backup = await Backup.getVersion(fileId, version);
      if (!backup) {
        return res.status(404).json(ResponseUtil.error('备份版本不存在'));
      }

      // 恢复文件
      await fs.copyFile(backup.backup_path, file.file_path);

      logger.info(`恢复备份: 文件${fileId} 到版本${version}`);
      res.json(ResponseUtil.success(null, '文件恢复成功'));
    } catch (error) {
      logger.error('恢复备份失败:', error);
      res.status(500).json(ResponseUtil.error('恢复备份失败'));
    }
  }

  /**
   * 删除备份
   */
  static async delete(req, res) {
    try {
      const { backupId } = req.params;
      const success = await Backup.delete(backupId);

      if (!success) {
        return res.status(404).json(ResponseUtil.error('备份不存在'));
      }

      logger.info(`删除备份: ${backupId}`);
      res.json(ResponseUtil.success(null, '备份删除成功'));
    } catch (error) {
      logger.error('删除备份失败:', error);
      res.status(500).json(ResponseUtil.error('删除备份失败'));
    }
  }
}

module.exports = BackupController; 