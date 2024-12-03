const express = require('express');
const router = express.Router();
const FileController = require('../controllers/fileController');
const auth = require('../middlewares/auth');

// 所有路由都需要认证
router.use(auth.verifyToken);

// 文件上传
router.post('/upload', FileController.upload);

// 文件下载
router.get('/download/:id', FileController.download);

// 获取文件列表
router.get('/list', FileController.list);

// 删除文件
router.delete('/:id', FileController.delete);

// 获取文件详情
router.get('/:id/detail', FileController.getDetail);

module.exports = router; 