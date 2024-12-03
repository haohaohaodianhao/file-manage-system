const pool = require('../config/database');

class Log {
  /**
   * 创建日志记录
   * @param {Object} logData - 日志数据
   * @returns {Promise<Object>} 创建的日志对象
   */
  static async create(logData) {
    const {
      userId,
      action,
      targetType,
      targetId,
      details
    } = logData;

    const query = `
      INSERT INTO logs (
        user_id, 
        action, 
        target_type, 
        target_id, 
        details
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      userId,
      action,
      targetType,
      targetId,
      details
    ]);
    return rows[0];
  }

  /**
   * 获取日志列表
   * @param {Object} filters - 过滤条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>} 日志列表和总数
   */
  static async list(filters = {}, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE 1=1';
    const values = [];
    let valueIndex = 1;

    if (filters.userId) {
      whereClause += ` AND user_id = $${valueIndex}`;
      values.push(filters.userId);
      valueIndex++;
    }

    if (filters.action) {
      whereClause += ` AND action = $${valueIndex}`;
      values.push(filters.action);
      valueIndex++;
    }

    if (filters.targetType) {
      whereClause += ` AND target_type = $${valueIndex}`;
      values.push(filters.targetType);
      valueIndex++;
    }

    if (filters.startDate) {
      whereClause += ` AND created_at >= $${valueIndex}`;
      values.push(filters.startDate);
      valueIndex++;
    }

    if (filters.endDate) {
      whereClause += ` AND created_at <= $${valueIndex}`;
      values.push(filters.endDate);
      valueIndex++;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM logs
      ${whereClause}
    `;

    const listQuery = `
      SELECT l.*, u.username as username
      FROM logs l
      LEFT JOIN users u ON u.id = l.user_id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
    `;

    const [countResult, listResult] = await Promise.all([
      pool.query(countQuery, values),
      pool.query(listQuery, [...values, pageSize, offset])
    ]);

    return {
      total: parseInt(countResult.rows[0].total),
      logs: listResult.rows
    };
  }

  /**
   * 获取日志详情
   * @param {number} logId - 日志ID
   * @returns {Promise<Object>} 日志对象
   */
  static async getById(logId) {
    const query = `
      SELECT l.*, u.username as username
      FROM logs l
      LEFT JOIN users u ON u.id = l.user_id
      WHERE l.id = $1
    `;
    const { rows } = await pool.query(query, [logId]);
    return rows[0];
  }

  /**
   * 删除日志
   * @param {number} logId - 日志ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(logId) {
    const query = 'DELETE FROM logs WHERE id = $1 RETURNING id';
    const { rows } = await pool.query(query, [logId]);
    return rows.length > 0;
  }

  /**
   * 清理旧日志
   * @param {number} days - 保留天数
   */
  static async cleanOldLogs(days) {
    const query = `
      DELETE FROM logs
      WHERE created_at < NOW() - INTERVAL '${days} days'
    `;
    await pool.query(query);
  }
}

module.exports = Log; 