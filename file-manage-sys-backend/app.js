const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/tags', require('./routes/tagRoutes'));
app.use('/api/backups', require('./routes/backupRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));

// 错误处理
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`服务器运行在端口 ${port}`);
}); 