const express = require('express');
const router = express.Router();
const LogController = require('../controllers/logController');
const auth = require('../middlewares/auth');

// 所有路由都需要认证和管理员权限
router.use(auth.verifyToken);
router.use(auth.isAdmin);

// 获取日志列表
router.get('/', LogController.list);

// 获取日志详情
router.get('/:id', LogController.getById);

// 删除日志
router.delete('/:id', LogController.delete);

// 清理旧日志
router.post('/clean', LogController.cleanOldLogs);

module.exports = router; 