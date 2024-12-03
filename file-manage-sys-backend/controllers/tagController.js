const Tag = require('../models/tag');
const ResponseUtil = require('../utils/response');
const logger = require('../config/logger');

class TagController {
  /**
   * 创建标签
   */
  static async create(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json(ResponseUtil.error('标签名称不能为空'));
      }

      const tag = await Tag.create(name, req.user.id);
      logger.info(`创建标签: ${tag.id}`);
      res.json(ResponseUtil.success(tag, '标签创建成功'));
    } catch (error) {
      logger.error('创建标签失败:', error);
      res.status(500).json(ResponseUtil.error('创建标签失败'));
    }
  }

  /**
   * 获取用户的所有标签
   */
  static async list(req, res) {
    try {
      const tags = await Tag.listByUser(req.user.id);
      res.json(ResponseUtil.success(tags));
    } catch (error) {
      logger.error('获取标签列表失败:', error);
      res.status(500).json(ResponseUtil.error('获取标签列表失败'));
    }
  }

  /**
   * 为文件添加标签
   */
  static async addToFile(req, res) {
    try {
      const { fileId, tagId } = req.body;
      await Tag.addToFile(fileId, tagId);
      logger.info(`为文件 ${fileId} 添加标签 ${tagId}`);
      res.json(ResponseUtil.success(null, '标签添加成功'));
    } catch (error) {
      logger.error('添加标签失败:', error);
      res.status(500).json(ResponseUtil.error('添加标签失败'));
    }
  }

  /**
   * 从文件移除标签
   */
  static async removeFromFile(req, res) {
    try {
      const { fileId, tagId } = req.params;
      await Tag.removeFromFile(fileId, tagId);
      logger.info(`从文件 ${fileId} 移除标签 ${tagId}`);
      res.json(ResponseUtil.success(null, '标签移除成功'));
    } catch (error) {
      logger.error('移除标签失败:', error);
      res.status(500).json(ResponseUtil.error('移除标签失败'));
    }
  }

  /**
   * 获取文件的所有标签
   */
  static async getFilesTags(req, res) {
    try {
      const { fileId } = req.params;
      const tags = await Tag.getFilesTags(fileId);
      res.json(ResponseUtil.success(tags));
    } catch (error) {
      logger.error('获取文件标签失败:', error);
      res.status(500).json(ResponseUtil.error('获取文件标签失败'));
    }
  }

  /**
   * 删除标签
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const success = await Tag.delete(id, req.user.id);
      
      if (!success) {
        return res.status(404).json(ResponseUtil.error('标签不存在或无权删除'));
      }

      logger.info(`删除标签: ${id}`);
      res.json(ResponseUtil.success(null, '标签删除成功'));
    } catch (error) {
      logger.error('删除标签失败:', error);
      res.status(500).json(ResponseUtil.error('删除标签失败'));
    }
  }

  /**
   * 通过标签搜索文件
   */
  static async searchFiles(req, res) {
    try {
      const { tagId } = req.params;
      const files = await Tag.searchFilesByTag(tagId, req.user.id);
      res.json(ResponseUtil.success(files));
    } catch (error) {
      logger.error('搜索文件失败:', error);
      res.status(500).json(ResponseUtil.error('搜索文件失败'));
    }
  }
}

module.exports = TagController; 