import request from '@/utils/request';

// 创建文件备份
export function createBackup(fileId) {
  return request({
    url: `/backups/file/${fileId}`,
    method: 'post'
  });
}

// 获取文件的备份列表
export function getBackupList(fileId) {
  return request({
    url: `/backups/file/${fileId}`,
    method: 'get'
  });
}

// 恢复到指定版本
export function restoreBackup(fileId, version) {
  return request({
    url: `/backups/file/${fileId}/restore/${version}`,
    method: 'post'
  });
}

// 删除备份
export function deleteBackup(backupId) {
  return request({
    url: `/backups/${backupId}`,
    method: 'delete'
  });
} 