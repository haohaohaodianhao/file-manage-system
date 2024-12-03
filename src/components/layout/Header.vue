<template>
  <div class="header-container">
    <div class="left">
      <h2>文件管理系统</h2>
    </div>
    <div class="right">
      <el-dropdown @command="handleCommand">
        <span class="user-info">
          {{ username }}
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const username = ref(localStorage.getItem('username'));

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.clear();
    ElMessage.success('退出成功');
    router.push('/login');
  }
};
</script>

<style lang="scss" scoped>
.header-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .user-info {
    cursor: pointer;
    display: flex;
    align-items: center;
  }
}
</style>
