const { Pool } = require('pg');

// 数据库连接配置
const pool = new Pool({
  connectionString: 'postgresql://postgres:bnfvr8f2@file-manage-sys-develop-postgresql.ns-vycc8n94.svc:5432'
});

// 测试数据库连接
pool.connect((err, client, release) => {
  if (err) {
    console.error('数据库连接错误:', err);
    return;
  }
  console.log('数据库连接成功！');
  release();
});

module.exports = pool; 