<template>
  <div class="log-container">
    <!-- 搜索和操作栏 -->
    <div class="operation-bar">
      <div class="left">
        <el-button type="danger" @click="handleCleanLogs">
          清理旧日志
        </el-button>
      </div>
      <div class="right">
        <el-select v-model="searchForm.action" placeholder="操作类型" clearable>
          <el-option label="上传" value="upload" />
          <el-option label="下载" value="download" />
          <el-option label="删除" value="delete" />
          <el-option label="备份" value="backup" />
        </el-select>
        <el-select v-model="searchForm.targetType" placeholder="目标类型" clearable>
          <el-option label="文件" value="file" />
          <el-option label="用户" value="user" />
          <el-option label="备份" value="backup" />
        </el-select>
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
        <el-button type="primary" @click="handleSearch">
          搜索
        </el-button>
      </div>
    </div>

    <!-- 日志列表 -->
    <el-table :data="logList" border style="width: 100%">
      <el-table-column prop="username" label="操作用户" width="120" />
      <el-table-column prop="action" label="操作类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getActionTagType(row.action)">
            {{ row.action }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="target_type" label="目标类型" width="100" />
      <el-table-column prop="target_id" label="目标ID" width="100" />
      <el-table-column prop="created_at" label="操作时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="details" label="详细信息">
        <template #default="{ row }">
          <pre>{{ formatDetails(row.details) }}</pre>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="danger" link @click="handleDelete(row)">
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

    <!-- 清理日志对话框 -->
    <el-dialog
      v-model="cleanDialogVisible"
      title="清理旧日志"
      width="30%"
    >
      <el-form :model="cleanForm" label-width="100px">
        <el-form-item label="保留天数">
          <el-input-number v-model="cleanForm.days" :min="1" :max="365" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cleanDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmCleanLogs">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getLogList, deleteLog, cleanOldLogs } from '@/api/log';

// 状态变量
const logList = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const cleanDialogVisible = ref(false);

const searchForm = reactive({
  action: '',
  targetType: '',
  dateRange: []
});

const cleanForm = reactive({
  days: 30
});

// 获取日志列表
const getLogs = async () => {
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      action: searchForm.action,
      targetType: searchForm.targetType,
      startDate: searchForm.dateRange[0],
      endDate: searchForm.dateRange[1]
    };

    const res = await getLogList(params);
    logList.value = res.Data.logs;
    total.value = res.Data.total;
  } catch (error) {
    console.error('获取日志列表失败:', error);
  }
};

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1;
  getLogs();
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  getLogs();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  getLogs();
};

// 删除日志
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该日志记录吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteLog(row.id);
      ElMessage.success('删除成功');
      getLogs();
    } catch (error) {
      console.error('删除日志失败:', error);
    }
  });
};

// 清理日志
const handleCleanLogs = () => {
  cleanDialogVisible.value = true;
};

const confirmCleanLogs = async () => {
  try {
    await cleanOldLogs({ days: cleanForm.days });
    ElMessage.success('清理成功');
    cleanDialogVisible.value = false;
    getLogs();
  } catch (error) {
    console.error('清理日志失败:', error);
  }
};

// 工具函数
const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

const formatDetails = (details) => {
  if (typeof details === 'string') {
    try {
      return JSON.stringify(JSON.parse(details), null, 2);
    } catch {
      return details;
    }
  }
  return JSON.stringify(details, null, 2);
};

const getActionTagType = (action) => {
  const types = {
    upload: 'success',
    download: 'info',
    delete: 'danger',
    backup: 'warning'
  };
  return types[action] || '';
};

// 初始化
getLogs();
</script>

<style lang="scss" scoped>
.log-container {
  .operation-bar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;

    .right {
      display: flex;
      gap: 10px;
    }
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}
</style>
