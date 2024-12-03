<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 class="card-title">{{ isLogin ? '登录' : '注册' }}</h2>
      </template>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        @keyup.enter="handleSubmit"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            {{ isLogin ? '登录' : '注册' }}
          </el-button>
          <el-button @click="toggleMode">
            {{ isLogin ? '去注册' : '去登录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { login, register } from '@/api/user';

const router = useRouter();
const formRef = ref(null);
const loading = ref(false);
const isLogin = ref(true);

const form = reactive({
  username: '',
  password: ''
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    loading.value = true;
    
    const api = isLogin.value ? login : register;
    const res = await api(form);
    
    if (isLogin.value) {
      // 保存登录信息
      localStorage.setItem('token', res.Data.token);
      localStorage.setItem('username', form.username);
      localStorage.setItem('userRole', res.Data.role);
      
      ElMessage.success('登录成功');
      router.push('/');
    } else {
      ElMessage.success('注册成功');
      isLogin.value = true;
    }
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    loading.value = false;
  }
};

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  form.username = '';
  form.password = '';
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};
</script>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
  
  .login-card {
    width: 400px;
    
    .card-title {
      text-align: center;
      margin: 0;
    }
  }
}
</style>
