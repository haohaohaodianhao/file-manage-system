const pool = require('../config/database');

class Backup {
  /**
   * 创建备份
   * @param {Object} backupData - 备份数据
   * @returns {Promise<Object>} 创建的备份对象
   */
  static async create(backupData) {
    const { fileId, backupPath, version } = backupData;
    
    const query = `
      INSERT INTO backups (file_id, backup_path, version)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [fileId, backupPath, version]);
    return rows[0];
  }

  /**
   * 获取文件的所有备份
   * @param {number} fileId - 文件ID
   * @returns {Promise<Array>} 备份列表
   */
  static async listByFile(fileId) {
    const query = `
      SELECT b.*, f.original_name as file_name
      FROM backups b
      JOIN files f ON f.id = b.file_id
      WHERE b.file_id = $1
      ORDER BY b.version DESC
    `;
    const { rows } = await pool.query(query, [fileId]);
    return rows;
  }

  /**
   * 获取特定版本的备份
   * @param {number} fileId - 文件ID
   * @param {number} version - 版本号
   * @returns {Promise<Object>} 备份对象
   */
  static async getVersion(fileId, version) {
    const query = `
      SELECT b.*, f.original_name as file_name
      FROM backups b
      JOIN files f ON f.id = b.file_id
      WHERE b.file_id = $1 AND b.version = $2
    `;
    const { rows } = await pool.query(query, [fileId, version]);
    return rows[0];
  }

  /**
   * 获取文件的最新版本号
   * @param {number} fileId - 文件ID
   * @returns {Promise<number>} 最新版本号
   */
  static async getLatestVersion(fileId) {
    const query = `
      SELECT MAX(version) as latest_version
      FROM backups
      WHERE file_id = $1
    `;
    const { rows } = await pool.query(query, [fileId]);
    return rows[0]?.latest_version || 0;
  }

  /**
   * 删除备份
   * @param {number} backupId - 备份ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(backupId) {
    const query = 'DELETE FROM backups WHERE id = $1 RETURNING id';
    const { rows } = await pool.query(query, [backupId]);
    return rows.length > 0;
  }

  /**
   * 清理旧备份（保留最新的N个版本）
   * @param {number} fileId - 文件ID
   * @param {number} keepVersions - 保留的版本数
   */
  static async cleanOldBackups(fileId, keepVersions) {
    const query = `
      DELETE FROM backups
      WHERE id IN (
        SELECT id
        FROM backups
        WHERE file_id = $1
        ORDER BY version DESC
        OFFSET $2
      )
    `;
    await pool.query(query, [fileId, keepVersions]);
  }
}

module.exports = Backup; 