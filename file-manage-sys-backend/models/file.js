const pool = require('../config/database');

class File {
  /**
   * 创建文件记录
   * @param {Object} fileData - 文件数据
   * @returns {Promise<Object>} 创建的文件对象
   */
  static async create(fileData) {
    const {
      filename,
      originalName,
      filePath,
      fileSize,
      fileType,
      userId
    } = fileData;

    const query = `
      INSERT INTO files (
        filename, 
        original_name, 
        file_path, 
        file_size, 
        file_type, 
        user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      filename,
      originalName,
      filePath,
      fileSize,
      fileType,
      userId
    ]);
    return rows[0];
  }

  /**
   * 获取文件列表
   * @param {Object} filters - 过滤条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>} 文件列表和总数
   */
  static async list(filters = {}, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE f.is_deleted = false';
    const values = [];
    let valueIndex = 1;

    if (filters.userId) {
      whereClause += ` AND f.user_id = $${valueIndex}`;
      values.push(filters.userId);
      valueIndex++;
    }

    if (filters.fileType) {
      if (filters.fileType === 'other') {
        const knownTypes = [
          '.doc', '.docx', '.pdf', '.txt',
          '.js', '.java', '.py', '.cpp', '.cs', '.html', '.css', '.php', '.sql',
          '.jpg', '.jpeg', '.png', '.gif',
          '.mp4', '.avi', '.mov',
          '.mp3', '.wav', '.ogg',
          '.zip', '.rar', '.7z'
        ];
        whereClause += ` AND (f.file_type IS NULL OR f.file_type != ALL($${valueIndex}::text[]))`;
        values.push(knownTypes);
      } else {
        const types = filters.fileType.split(',');
        whereClause += ` AND f.file_type = ANY($${valueIndex}::text[])`;
        values.push(types);
      }
      valueIndex++;
    }

    if (filters.keyword) {
      whereClause += ` AND f.original_name ILIKE $${valueIndex}`;
      values.push(`%${filters.keyword}%`);
      valueIndex++;
    }

    if (filters.tagId) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM file_tags ft 
        WHERE ft.file_id = f.id 
        AND ft.tag_id = $${valueIndex}
      )`;
      values.push(filters.tagId);
      valueIndex++;
    }

    const countQuery = `
      SELECT COUNT(DISTINCT f.id) as total
      FROM files f
      LEFT JOIN file_tags ft ON f.id = ft.file_id
      LEFT JOIN tags t ON ft.tag_id = t.id
      ${whereClause}
    `;

    const listQuery = `
      SELECT f.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', t.id,
                   'name', t.name
                 )
               ) FILTER (WHERE t.id IS NOT NULL),
               '[]'
             ) as tags
      FROM files f
      LEFT JOIN file_tags ft ON f.id = ft.file_id
      LEFT JOIN tags t ON ft.tag_id = t.id
      ${whereClause}
      GROUP BY f.id
      ORDER BY f.created_at DESC
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
    `;

    const [countResult, listResult] = await Promise.all([
      pool.query(countQuery, values),
      pool.query(listQuery, [...values, pageSize, offset])
    ]);

    return {
      total: parseInt(countResult.rows[0].total),
      files: listResult.rows
    };
  }

  /**
   * 获取文件详情
   * @param {number} fileId - 文件ID
   * @returns {Promise<Object>} 文件对象
   */
  static async getById(fileId) {
    const query = 'SELECT * FROM files WHERE id = $1 AND is_deleted = false';
    const { rows } = await pool.query(query, [fileId]);
    return rows[0];
  }

  /**
   * 软删除文件
   * @param {number} fileId - 文件ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(fileId) {
    const query = `
      UPDATE files
      SET is_deleted = true
      WHERE id = $1
      RETURNING id
    `;
    const { rows } = await pool.query(query, [fileId]);
    return rows.length > 0;
  }
}

module.exports = File; 