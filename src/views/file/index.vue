<template>
  <div class="file-container">
    <!-- 搜索和操作栏 -->
    <div class="operation-bar">
      <div class="left">
        <el-upload
          class="upload-btn"
          :action="null"
          :http-request="handleUpload"
          :show-file-list="false"
          :multiple="true"
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon>
            上传文件
          </el-button>
        </el-upload>
      </div>
      <div class="right">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文件名"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #suffix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="fileType" placeholder="文件类型" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="文档" value=".doc,.docx,.pdf,.txt" />
          <el-option label="代码" value=".js,.java,.py,.cpp,.cs,.html,.css,.php,.sql" />
          <el-option label="图片" value=".jpg,.jpeg,.png,.gif" />
          <el-option label="视频" value=".mp4,.avi,.mov" />
          <el-option label="音频" value=".mp3,.wav,.ogg" />
          <el-option label="压缩包" value=".zip,.rar,.7z" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-select
          v-model="selectedFilterTag"
          placeholder="按标签筛选"
          clearable
          @change="handleSearch"
          class="tag-filter"
        >
          <el-option
            v-for="tag in tagList"
            :key="tag.id"
            :label="tag.name"
            :value="tag.id"
          />
        </el-select>
      </div>
    </div>

    <!-- 文件列表 -->
    <el-table :data="fileList" border style="width: 100%">
      <el-table-column prop="original_name" label="文件名" min-width="200">
        <template #default="{ row }">
          <el-tooltip :content="row.original_name" placement="top">
            <span class="file-name">{{ row.original_name }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="file_type" label="类型" width="100">
        <template #default="{ row }">
          {{ row.file_type }}
        </template>
      </el-table-column>
      <el-table-column prop="file_size" label="大小" width="120">
        <template #default="{ row }">
          {{ formatFileSize(row.file_size) }}
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="上传时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="标签" min-width="150">
        <template #default="{ row }">
          <div class="tag-list">
            <el-tag
              v-for="tag in row.tags"
              :key="tag.id"
              size="small"
              class="tag-item"
            >
              {{ tag.name }}
            </el-tag>
            <el-button
              type="primary"
              link
              size="small"
              @click="handleManageTags(row)"
            >
              管理标签
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleDownload(row)">
            <el-icon><Download /></el-icon>
            下载
          </el-button>
          <el-button type="danger" link @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 添加标签管理对话框 -->
    <el-dialog
      v-model="tagDialogVisible"
      title="管理标签"
      width="500px"
    >
      <div v-if="selectedFile" class="tag-dialog-content">
        <div class="current-tags">
          <h4>当前标签：</h4>
          <el-tag
            v-for="tag in currentFileTags"
            :key="tag.id"
            closable
            @close="handleRemoveTag(tag)"
          >
            {{ tag.name }}
          </el-tag>
        </div>

        <div class="add-tag">
          <h4>添加标签：</h4>
          <div class="tag-select-row">
            <el-select
              v-model="selectedTag"
              placeholder="选择标签"
              class="tag-select"
            >
              <el-option
                v-for="tag in availableTags"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              />
            </el-select>
            <el-button type="primary" @click="handleAddTag">添加</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Upload, Download, Delete } from '@element-plus/icons-vue';
import { getFileList, uploadFile, downloadFile, deleteFile } from '@/api/file';
import { getTagList, addTagToFile, removeTagFromFile, getFileTags } from '@/api/tag';

// 状态变量
const fileList = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchQuery = ref('');
const fileType = ref('');

// 标签相关的状态
const tagList = ref([]);
const selectedFile = ref(null);
const currentFileTags = ref([]);
const selectedTag = ref(null);
const tagDialogVisible = ref(false);

// 添加标签过滤状态
const selectedFilterTag = ref(null);

// 计算可用的标签（排除已添加的标签）
const availableTags = computed(() => {
  const currentTagIds = currentFileTags.value.map(tag => tag.id);
  return tagList.value.filter(tag => !currentTagIds.includes(tag.id));
});

// 获取文件列表
const getFiles = async () => {
  try {
    const res = await getFileList({
      page: currentPage.value,
      pageSize: pageSize.value,
      fileType: fileType.value,
      keyword: searchQuery.value,
      tagId: selectedFilterTag.value
    });
    fileList.value = res.Data.files;
    total.value = res.Data.total;
  } catch (error) {
    ElMessage.error('获取文件列表失败');
    console.error('获取文件列表失败:', error);
  }
};

// 文件上传
const handleUpload = async ({ file }) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await uploadFile(formData);
    if (res.Success) {
      ElMessage.success('上传成功');
      getFiles();
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.Msg || '上传失败');
    console.error('上传失败:', error);
  }
};

// 文件下载
const handleDownload = async (row) => {
  try {
    const res = await downloadFile(row.id);
    
    // 检查是否是错误响应
    if (res instanceof Blob && res.type === 'application/json') {
      const text = await res.text();
      const error = JSON.parse(text);
      throw new Error(error.Msg || '下载失败');
    }
    
    // 创建 blob URL
    const blob = new Blob([res], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    
    // 创建临时下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = row.original_name;
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    ElMessage.error(error.message || '下载失败');
    console.error('下载失败:', error);
  }
};

// 文件删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该文件吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteFile(row.id);
      ElMessage.success('删除成功');
      getFiles();
    } catch (error) {
      console.error('删除失败:', error);
    }
  });
};

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1;
  getFiles();
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  getFiles();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  getFiles();
};

// 工具函数
const formatFileSize = (size) => {
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB';
  return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

// 获取所有标签
const getTags = async () => {
  try {
    const res = await getTagList();
    tagList.value = res.Data;
  } catch (error) {
    console.error('获取标签列表失败:', error);
  }
};

// 获取文件的标签
const getFileTagList = async (fileId) => {
  try {
    const res = await getFileTags(fileId);
    currentFileTags.value = res.Data;
  } catch (error) {
    console.error('获取文件标签失败:', error);
  }
};

// 打开标签管理对话框
const handleManageTags = async (file) => {
  selectedFile.value = file;
  await getFileTagList(file.id);
  tagDialogVisible.value = true;
};

// 添加标签
const handleAddTag = async () => {
  if (!selectedTag.value) return;
  
  try {
    await addTagToFile({
      fileId: selectedFile.value.id,
      tagId: selectedTag.value
    });
    await getFileTagList(selectedFile.value.id);
    await getFiles(); // 刷新文件列表以更新标签
    selectedTag.value = null;
    ElMessage.success('添加标签成功');
  } catch (error) {
    console.error('添加标签失败:', error);
  }
};

// 移除标签
const handleRemoveTag = async (tag) => {
  try {
    await removeTagFromFile(selectedFile.value.id, tag.id);
    await getFileTagList(selectedFile.value.id);
    await getFiles(); // 刷新文件列表以更新标签
    ElMessage.success('移除标签成功');
  } catch (error) {
    console.error('移除标签失败:', error);
  }
};

// 初始化
onMounted(async () => {
  await getFiles();
  await getTags();
});

// 监听文件类型变化
watch([fileType, selectedFilterTag], () => {
  handleSearch();
});
</script>

<style lang="scss" scoped>
.file-container {
  .operation-bar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;

    .right {
      display: flex;
      gap: 10px;

      .search-input {
        width: 200px;
      }

      .el-select {
        width: 120px;
      }

      .tag-filter {
        width: 120px;
      }
    }
  }

  .file-name {
    display: inline-block;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;

  .tag-item {
    margin-right: 5px;
  }
}

.tag-dialog-content {
  .current-tags {
    margin-bottom: 20px;

    h4 {
      margin-bottom: 10px;
    }

    .el-tag {
      margin-right: 8px;
      margin-bottom: 8px;
    }
  }

  .add-tag {
    h4 {
      margin-bottom: 10px;
    }

    .tag-select-row {
      display: flex;
      gap: 10px;

      .tag-select {
        flex: 1;
      }
    }
  }
}
</style>
