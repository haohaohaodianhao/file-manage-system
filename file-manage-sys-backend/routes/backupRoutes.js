const express = require('express');
const router = express.Router();
const BackupController = require('../controllers/backupController');
const auth = require('../middlewares/auth');

// 所有路由都需要认证
router.use(auth.verifyToken);

// 创建文件备份
router.post('/file/:fileId', BackupController.create);

// 获取文件的所有备份
router.get('/file/:fileId', BackupController.list);

// 恢复到指定版本
router.post('/file/:fileId/restore/:version', BackupController.restore);

// 删除备份
router.delete('/:backupId', BackupController.delete);

module.exports = router; 