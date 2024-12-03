const File = require('../models/file');
const ResponseUtil = require('../utils/response');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const uniqueName = `${uuidv4()}${path.extname(originalName)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  }
}).single('file');

// 在类的顶部添加
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

class FileController {
  /**
   * 上传文件
   */
  static async upload(req, res) {
    upload(req, res, async (err) => {
      try {
        if (err instanceof multer.MulterError) {
          return res.status(400).json(ResponseUtil.error('文件上传错误: ' + err.message));
        } else if (err) {
          return res.status(400).json(ResponseUtil.error('文件上传失败: ' + err.message));
        }

        if (!req.file) {
          return res.status(400).json(ResponseUtil.error('没有选择文件'));
        }

        const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

        const fileData = {
          filename: req.file.filename,
          originalName: originalName,
          filePath: req.file.path,
          fileSize: req.file.size,
          fileType: path.extname(originalName).toLowerCase(),
          userId: req.user.id
        };

        const savedFile = await File.create(fileData);
        logger.info(`文件上传成功: ${savedFile.id}`);
        res.json(ResponseUtil.success(savedFile, '文件上传成功'));
      } catch (error) {
        logger.error('文件上传失败:', error);
        res.status(500).json(ResponseUtil.error('文件上传失败'));
      }
    });
  }

  /**
   * 下载文件
   */
  static async download(req, res) {
    try {
      const fileId = req.params.id;
      const file = await File.getById(fileId);

      if (!file) {
        return res.status(404).json(ResponseUtil.error('文件不存在'));
      }

      // 检查权限
      if (file.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json(ResponseUtil.error('没有权限下载此文件'));
      }

      // 检查文件是否存在
      try {
        await fsPromises.access(file.file_path);
      } catch (error) {
        return res.status(404).json(ResponseUtil.error('文件不存在或已被删除'));
      }

      // 设置响应头
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`);

      // 使用流式传输文件
      const fileStream = fs.createReadStream(file.file_path);
      
      // 错误处理
      fileStream.on('error', (error) => {
        logger.error('文件读取失败:', error);
        if (!res.headersSent) {
          res.status(500).json(ResponseUtil.error('文件读取失败'));
        }
      });

      // 完成处理
      fileStream.on('end', () => {
        logger.info(`文件下载完成: ${fileId}`);
      });

      // 管道传输到响应
      fileStream.pipe(res);
    } catch (error) {
      logger.error('文件下载失败:', error);
      if (!res.headersSent) {
        res.status(500).json(ResponseUtil.error('文件下载失败'));
      }
    }
  }

  /**
   * 获取文件列表
   */
  static async list(req, res) {
    try {
      const { page = 1, pageSize = 10, fileType, keyword, tagId } = req.query;
      const filters = {
        userId: req.user.role === 'admin' ? null : req.user.id,
        fileType,
        keyword,
        tagId: tagId ? parseInt(tagId) : null
      };

      const result = await File.list(filters, parseInt(page), parseInt(pageSize));
      res.json(ResponseUtil.success(result));
    } catch (error) {
      logger.error('获取文件列表失败:', error);
      res.status(500).json(ResponseUtil.error('获取文件列表失败'));
    }
  }

  /**
   * 删除文件
   */
  static async delete(req, res) {
    try {
      const fileId = req.params.id;
      const file = await File.getById(fileId);

      if (!file) {
        return res.status(404).json(ResponseUtil.error('文件不存在'));
      }

      // 检查权限
      if (file.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json(ResponseUtil.error('没有权限删除此文件'));
      }

      await File.delete(fileId);
      logger.info(`文件删除: ${fileId}`);
      res.json(ResponseUtil.success(null, '文件删除成功'));
    } catch (error) {
      logger.error('文件删除失败:', error);
      res.status(500).json(ResponseUtil.error('文件删除失败'));
    }
  }
}

module.exports = FileController; 