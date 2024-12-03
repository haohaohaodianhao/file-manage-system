const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const auth = require('../middlewares/auth');

// 公开路由
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// 需要认证的路由
router.get('/profile', auth.verifyToken, (req, res) => {
  res.json(ResponseUtil.success(req.user));
});

module.exports = router; 