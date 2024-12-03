import request from '@/utils/request';

// 获取标签列表
export function getTagList() {
  return request({
    url: '/tags',
    method: 'get'
  });
}

// 创建标签
export function createTag(data) {
  return request({
    url: '/tags',
    method: 'post',
    data
  });
}

// 删除标签
export function deleteTag(id) {
  return request({
    url: `/tags/${id}`,
    method: 'delete'
  });
}

// 为文件添加标签
export function addTagToFile(data) {
  return request({
    url: '/tags/file',
    method: 'post',
    data
  });
}

// 从文件移除标签
export function removeTagFromFile(fileId, tagId) {
  return request({
    url: `/tags/file/${fileId}/tag/${tagId}`,
    method: 'delete'
  });
}

// 获取文件的标签
export function getFileTags(fileId) {
  return request({
    url: `/tags/file/${fileId}`,
    method: 'get'
  });
}

// 通过标签搜索文件
export function searchFilesByTag(tagId) {
  return request({
    url: `/tags/${tagId}/files`,
    method: 'get'
  });
} 