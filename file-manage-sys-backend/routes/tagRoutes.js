const express = require('express');
const router = express.Router();
const TagController = require('../controllers/tagController');
const auth = require('../middlewares/auth');

// 所有路由都需要认证
router.use(auth.verifyToken);

// 创建标签
router.post('/', TagController.create);

// 获取用户的所有标签
router.get('/', TagController.list);

// 为文件添加标签
router.post('/file', TagController.addToFile);

// 从文件移除标签
router.delete('/file/:fileId/tag/:tagId', TagController.removeFromFile);

// 获取文件的所有标签
router.get('/file/:fileId', TagController.getFilesTags);

// 删除标签
router.delete('/:id', TagController.delete);

// 通过标签搜索文件
router.get('/:tagId/files', TagController.searchFiles);

module.exports = router; 