const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    // 读取SQL文件
    const sql = fs.readFileSync(
      path.join(__dirname, '../models/database.sql'),
      'utf8'
    );

    // 执行SQL
    await pool.query(sql);
    console.log('数据库表创建成功');

    // 创建默认管理员用户
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await pool.query(`
      INSERT INTO users (username, password, role)
      VALUES ('admin', $1, 'admin')
      ON CONFLICT (username) DO NOTHING
    `, [hashedPassword]);
    
    console.log('默认管理员用户创建成功');
  } catch (error) {
    console.error('初始化数据库失败:', error);
  } finally {
    pool.end();
  }
}

initDatabase(); 