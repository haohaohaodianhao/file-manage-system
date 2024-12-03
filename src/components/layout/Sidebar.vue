<template>
  <el-menu
    :default-active="route.path"
    class="sidebar-menu"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409EFF"
    router
  >
    <el-menu-item index="/file">
      <el-icon><Document /></el-icon>
      <span>文件管理</span>
    </el-menu-item>
    <el-menu-item index="/tag">
      <el-icon><Collection /></el-icon>
      <span>标签管理</span>
    </el-menu-item>
    <el-menu-item index="/backup">
      <el-icon><CopyDocument /></el-icon>
      <span>备份管理</span>
    </el-menu-item>
    <el-menu-item v-if="isAdmin" index="/log">
      <el-icon><List /></el-icon>
      <span>日志管理</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { Document, Collection, CopyDocument, List } from '@element-plus/icons-vue';

const route = useRoute();
const isAdmin = computed(() => localStorage.getItem('userRole') === 'admin');
</script>

<style lang="scss" scoped>
.sidebar-menu {
  height: 100%;
  border-right: none;
}

.el-menu-item {
  display: flex;
  align-items: center;
  
  .el-icon {
    margin-right: 12px;
  }
}
</style> 