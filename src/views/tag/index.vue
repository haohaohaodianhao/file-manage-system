<template>
  <div class="tag-container">
    <!-- 标签管理部分 -->
    <el-card class="tag-card">
      <template #header>
        <div class="card-header">
          <span>标签管理</span>
          <el-button type="primary" @click="showCreateTagDialog">
            <el-icon><Plus /></el-icon>
            新建标签
          </el-button>
        </div>
      </template>

      <div class="tag-list">
        <el-tag
          v-for="tag in tagList"
          :key="tag.id"
          class="tag-item"
          closable
          @close="handleDeleteTag(tag)"
        >
          {{ tag.name }}
        </el-tag>
      </div>
    </el-card>

    <!-- 文件标签关联部分 -->
    <el-card class="file-tag-card">
      <template #header>
        <div class="card-header">
          <span>文件标签</span>
        </div>
      </template>

      <!-- 文件选择 -->
      <div class="file-select">
        <el-select
          v-model="selectedFile"
          placeholder="选择文件"
          filterable
          @change="handleFileSelect"
        >
          <el-option
            v-for="file in fileList"
            :key="file.id"
            :label="file.original_name"
            :value="file.id"
          />
        </el-select>
      </div>

      <!-- 文件的标签列表 -->
      <div v-if="selectedFile" class="file-tags">
        <div class="current-tags">
          <h4>当前标签：</h4>
          <el-tag
            v-for="tag in currentFileTags"
            :key="tag.id"
            closable
            @close="handleRemoveTagFromFile(tag)"
          >
            {{ tag.name }}
          </el-tag>
        </div>

        <div class="add-tag">
          <h4>添加标签：</h4>
          <el-select
            v-model="selectedTag"
            placeholder="选择标签"
            @change="handleAddTagToFile"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            />
          </el-select>
        </div>
      </div>
    </el-card>

    <!-- 创建标签对话框 -->
    <el-dialog
      v-model="createTagDialogVisible"
      title="新建标签"
      width="30%"
    >
      <el-form
        ref="tagFormRef"
        :model="tagForm"
        :rules="tagRules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="tagForm.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createTagDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateTag">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import {
  getTagList,
  createTag,
  deleteTag,
  addTagToFile,
  removeTagFromFile,
  getFileTags
} from '@/api/tag';
import { getFileList } from '@/api/file';

// 状态变量
const tagList = ref([]);
const fileList = ref([]);
const selectedFile = ref(null);
const currentFileTags = ref([]);
const selectedTag = ref(null);
const createTagDialogVisible = ref(false);
const tagFormRef = ref(null);

const tagForm = ref({
  name: ''
});

const tagRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ]
};

// 计算可用的标签（排除已添加的标签）
const availableTags = computed(() => {
  const currentTagIds = currentFileTags.value.map(tag => tag.id);
  return tagList.value.filter(tag => !currentTagIds.includes(tag.id));
});

// 获取标签列表
const getTags = async () => {
  try {
    const res = await getTagList();
    tagList.value = res.Data;
  } catch (error) {
    console.error('获取标签列表失败:', error);
  }
};

// 获取文件列表
const getFiles = async () => {
  try {
    const res = await getFileList({ pageSize: 1000 });
    fileList.value = res.Data.files;
  } catch (error) {
    console.error('获取文件列表失败:', error);
  }
};

// 获取文件的标签列表
const getFileTagList = async (fileId) => {
  try {
    const res = await getFileTags(fileId);
    currentFileTags.value = res.Data;
  } catch (error) {
    console.error('获取文件标签失败:', error);
  }
};

// 显示创建标签对话框
const showCreateTagDialog = () => {
  createTagDialogVisible.value = true;
  tagForm.value.name = '';
  if (tagFormRef.value) {
    tagFormRef.value.clearValidate();
  }
};

// 创建标签
const handleCreateTag = async () => {
  if (!tagFormRef.value) return;
  
  try {
    await tagFormRef.value.validate();
    await createTag(tagForm.value);
    ElMessage.success('创建成功');
    createTagDialogVisible.value = false;
    getTags();
  } catch (error) {
    console.error('创建标签失败:', error);
  }
};

// 删除标签
const handleDeleteTag = (tag) => {
  ElMessageBox.confirm('确定要删除该标签吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteTag(tag.id);
      ElMessage.success('删除成功');
      getTags();
    } catch (error) {
      console.error('删除标签失败:', error);
    }
  });
};

// 选择文件
const handleFileSelect = async (fileId) => {
  selectedTag.value = null;
  if (fileId) {
    await getFileTagList(fileId);
  } else {
    currentFileTags.value = [];
  }
};

// 为文件添加标签
const handleAddTagToFile = async (tagId) => {
  if (!selectedFile.value || !tagId) return;
  
  try {
    await addTagToFile({
      fileId: selectedFile.value,
      tagId
    });
    ElMessage.success('添加标签成功');
    await getFileTagList(selectedFile.value);
    selectedTag.value = null;
  } catch (error) {
    console.error('添加标签失败:', error);
  }
};

// 从文件移除标签
const handleRemoveTagFromFile = async (tag) => {
  try {
    await removeTagFromFile(selectedFile.value, tag.id);
    ElMessage.success('移除标签成功');
    await getFileTagList(selectedFile.value);
  } catch (error) {
    console.error('移除标签失败:', error);
  }
};

// 初始化
onMounted(() => {
  getTags();
  getFiles();
});
</script>

<style lang="scss" scoped>
.tag-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .tag-item {
      margin-right: 10px;
      margin-bottom: 10px;
    }
  }

  .file-select {
    margin-bottom: 20px;

    .el-select {
      width: 100%;
    }
  }

  .file-tags {
    .current-tags {
      margin-bottom: 20px;

      h4 {
        margin-bottom: 10px;
      }

      .el-tag {
        margin-right: 10px;
        margin-bottom: 10px;
      }
    }

    .add-tag {
      h4 {
        margin-bottom: 10px;
      }

      .el-select {
        width: 100%;
      }
    }
  }
}
</style>
