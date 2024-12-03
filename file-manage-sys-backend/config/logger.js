const winston = require('winston');
const { format } = winston;

// 创建日志记录器
const logger = winston.createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.json()
  ),
  transports: [
    // 信息级别日志
    new winston.transports.File({ 
      filename: 'logs/info.log',
      level: 'info'
    }),
    // 错误级别日志
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    })
  ]
});

// 开发环境下同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.simple()
  }));
}

module.exports = logger; 