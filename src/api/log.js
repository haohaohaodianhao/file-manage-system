import request from '@/utils/request';

// 获取日志列表
export function getLogList(params) {
  return request({
    url: '/logs',
    method: 'get',
    params
  });
}

// 获取日志详情
export function getLogDetail(id) {
  return request({
    url: `/logs/${id}`,
    method: 'get'
  });
}

// 删除日志
export function deleteLog(id) {
  return request({
    url: `/logs/${id}`,
    method: 'delete'
  });
}

// 清理旧日志
export function cleanOldLogs(data) {
  return request({
    url: '/logs/clean',
    method: 'post',
    data
  });
} 