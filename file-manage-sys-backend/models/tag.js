const pool = require('../config/database');

class Tag {
  /**
   * 创建标签
   * @param {string} name - 标签名称
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 创建的标签对象
   */
  static async create(name, userId) {
    const query = `
      INSERT INTO tags (name, user_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [name, userId]);
    return rows[0];
  }

  /**
   * 获取用户的所有标签
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 标签列表
   */
  static async listByUser(userId) {
    const query = 'SELECT * FROM tags WHERE user_id = $1 ORDER BY name';
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  /**
   * 为文件添加标签
   * @param {number} fileId - 文件ID
   * @param {number} tagId - 标签ID
   */
  static async addToFile(fileId, tagId) {
    const query = `
      INSERT INTO file_tags (file_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT (file_id, tag_id) DO NOTHING
    `;
    await pool.query(query, [fileId, tagId]);
  }

  /**
   * 从文件移除标签
   * @param {number} fileId - 文件ID
   * @param {number} tagId - 标签ID
   */
  static async removeFromFile(fileId, tagId) {
    const query = 'DELETE FROM file_tags WHERE file_id = $1 AND tag_id = $2';
    await pool.query(query, [fileId, tagId]);
  }

  /**
   * 获取文件的所有标签
   * @param {number} fileId - 文件ID
   * @returns {Promise<Array>} 标签列表
   */
  static async getFilesTags(fileId) {
    const query = `
      SELECT t.*
      FROM tags t
      JOIN file_tags ft ON ft.tag_id = t.id
      WHERE ft.file_id = $1
      ORDER BY t.name
    `;
    const { rows } = await pool.query(query, [fileId]);
    return rows;
  }

  /**
   * 删除标签
   * @param {number} tagId - 标签ID
   * @param {number} userId - 用户ID（用于权限验证）
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(tagId, userId) {
    // 首先删除文件-标签关联
    await pool.query('DELETE FROM file_tags WHERE tag_id = $1', [tagId]);
    
    // 然后删除标签本身
    const query = 'DELETE FROM tags WHERE id = $1 AND user_id = $2 RETURNING id';
    const { rows } = await pool.query(query, [tagId, userId]);
    return rows.length > 0;
  }

  /**
   * 通过标签搜索文件
   * @param {number} tagId - 标签ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 文件列表
   */
  static async searchFilesByTag(tagId, userId) {
    const query = `
      SELECT f.*
      FROM files f
      JOIN file_tags ft ON ft.file_id = f.id
      WHERE ft.tag_id = $1 
      AND f.user_id = $2 
      AND f.is_deleted = false
      ORDER BY f.created_at DESC
    `;
    const { rows } = await pool.query(query, [tagId, userId]);
    return rows;
  }
}

module.exports = Tag; 