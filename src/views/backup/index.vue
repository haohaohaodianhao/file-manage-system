<template>
  <div class="backup-container">
    <!-- 文件选择和备份操作 -->
    <el-card class="operation-card">
      <template #header>
        <div class="card-header">
          <span>备份管理</span>
        </div>
      </template>

      <div class="operation-content">
        <el-form :model="form" label-width="80px">
          <el-form-item label="选择文件">
            <el-select
              v-model="form.fileId"
              placeholder="请选择文件"
              filterable
              @change="handleFileSelect"
              style="width: 100%"
            >
              <el-option
                v-for="file in fileList"
                :key="file.id"
                :label="file.original_name"
                :value="file.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :disabled="!form.fileId"
              @click="handleCreateBackup"
            >
              创建备份
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 备份列表 -->
    <el-card v-if="form.fileId" class="backup-list-card">
      <template #header>
        <div class="card-header">
          <span>备份列表</span>
          <span class="file-name">{{ selectedFileName }}</span>
        </div>
      </template>

      <div class="backup-list">
        <el-empty v-if="!backupList.length" description="暂无备份" />
        
        <el-timeline v-else>
          <el-timeline-item
            v-for="backup in backupList"
            :key="backup.id"
            :timestamp="formatDate(backup.created_at)"
            placement="top"
          >
            <el-card class="backup-item">
              <div class="backup-info">
                <span class="version">版本 {{ backup.version }}</span>
                <div class="operations">
                  <el-button
                    type="primary"
                    link
                    @click="handleRestore(backup)"
                  >
                    恢复到此版本
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    @click="handleDelete(backup)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getFileList } from '@/api/file';
import {
  createBackup,
  getBackupList,
  restoreBackup,
  deleteBackup
} from '@/api/backup';

// 状态变量
const fileList = ref([]);
const backupList = ref([]);
const form = ref({
  fileId: null
});

// 计算选中的文件名
const selectedFileName = computed(() => {
  const file = fileList.value.find(f => f.id === form.value.fileId);
  return file ? file.original_name : '';
});

// 获取文件列表
const getFiles = async () => {
  try {
    const res = await getFileList({ pageSize: 1000 });
    fileList.value = res.Data.files;
  } catch (error) {
    console.error('获取文件列表失败:', error);
  }
};

// 获取备份列表
const getBackups = async (fileId) => {
  try {
    const res = await getBackupList(fileId);
    backupList.value = res.Data;
  } catch (error) {
    console.error('获取备份列表失败:', error);
  }
};

// 选择文件
const handleFileSelect = async (fileId) => {
  if (fileId) {
    await getBackups(fileId);
  } else {
    backupList.value = [];
  }
};

// 创建备份
const handleCreateBackup = async () => {
  if (!form.value.fileId) return;

  try {
    await createBackup(form.value.fileId);
    ElMessage.success('创建备份成功');
    await getBackups(form.value.fileId);
  } catch (error) {
    console.error('创建备份失败:', error);
  }
};

// 恢复备份
const handleRestore = async (backup) => {
  try {
    await ElMessageBox.confirm(
      `确定要将文件恢复到版本 ${backup.version} 吗？`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    );

    await restoreBackup(form.value.fileId, backup.version);
    ElMessage.success('恢复成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复备份失败:', error);
    }
  }
};

// 删除备份
const handleDelete = async (backup) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除版本 ${backup.version} 的备份吗？`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    );

    await deleteBackup(backup.id);
    ElMessage.success('删除成功');
    await getBackups(form.value.fileId);
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除备份失败:', error);
    }
  }
};

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

// 初始化
getFiles();
</script>

<style lang="scss" scoped>
.backup-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 20px;

    .file-name {
      color: #666;
      font-size: 14px;
    }
  }

  .backup-list {
    min-height: 200px;

    .backup-item {
      .backup-info {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .version {
          font-weight: bold;
        }

        .operations {
          display: flex;
          gap: 10px;
        }
      }
    }
  }
}
</style>
