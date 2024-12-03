const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户对象
   */
  static async create(userData) {
    const { username, password, role = 'user' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (username, password, role)
      VALUES ($1, $2, $3)
      RETURNING id, username, role, created_at
    `;
    
    const { rows } = await pool.query(query, [username, hashedPassword, role]);
    return rows[0];
  }

  /**
   * 通过用户名查找用户
   * @param {string} username - 用户名
   * @returns {Promise<Object>} 用户对象
   */
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const { rows } = await pool.query(query, [username]);
    return rows[0];
  }

  /**
   * 更新用户最后登录时间
   * @param {number} userId - 用户ID
   * @returns {Promise<void>}
   */
  static async updateLastLogin(userId) {
    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    await pool.query(query, [userId]);
  }
}

module.exports = User; 