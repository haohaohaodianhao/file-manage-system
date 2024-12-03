import request from '@/utils/request';

// 获取文件列表
export function getFileList(params) {
  return request({
    url: '/files/list',
    method: 'get',
    params
  });
}

// 上传文件
export function uploadFile(data) {
  return request({
    url: '/files/upload',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  });
}

// 下载文件
export function downloadFile(id) {
  return request({
    url: `/files/download/${id}`,
    method: 'get',
    responseType: 'blob',
    transformResponse: [(data) => data]
  });
}

// 删除文件
export function deleteFile(id) {
  return request({
    url: `/files/${id}`,
    method: 'delete'
  });
}

// 获取文件详情
export function getFileDetail(id) {
  return request({
    url: `/files/${id}/detail`,
    method: 'get'
  });
} 