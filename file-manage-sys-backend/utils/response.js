/**
 * 统一响应格式工具类
 */
class ResponseUtil {
  /**
   * 成功响应
   * @param {any} data - 响应数据
   * @param {string} msg - 响应消息
   */
  static success(data = {}, msg = '操作成功') {
    return {
      Success: true,
      Msg: msg,
      Data: data
    };
  }

  /**
   * 失败响应
   * @param {string} msg - 错误消息
   * @param {any} data - 错误数据
   */
  static error(msg = '操作失败', data = {}) {
    return {
      Success: false,
      Msg: msg,
      Data: data
    };
  }
}

module.exports = ResponseUtil; 